import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, BookOpen, ExternalLink, FileText, Trash2, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { CreateCategoryDialog } from "@/components/CreateCategoryDialog";
import { AddMaterialDialog } from "@/components/AddMaterialDialog";
import LoadingScreen from "@/components/LoadingScreen";

interface Material {
  id: string;
  name: string;
  type: string;
  url: string | null;
  file_path: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
  materials: Material[];
}

const Materials = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'category' | 'material', id: string } | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("material_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;

      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*")
        .order("display_order", { ascending: true });

      if (materialsError) throw materialsError;

      const categoriesWithMaterials = (categoriesData || []).map((cat) => ({
        ...cat,
        materials: (materialsData || []).filter((mat) => mat.category_id === cat.id),
      }));

      setCategories(categoriesWithMaterials);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog) return;

    try {
      if (deleteDialog.type === 'category') {
        const { error } = await supabase
          .from("material_categories")
          .delete()
          .eq("id", deleteDialog.id);
        if (error) throw error;
        toast({ description: "Categoria excluída com sucesso!" });
      } else {
        const { error } = await supabase
          .from("materials")
          .delete()
          .eq("id", deleteDialog.id);
        if (error) throw error;
        toast({ description: "Material excluído com sucesso!" });
      }
      fetchCategories();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || "Erro ao excluir" });
    } finally {
      setDeleteDialog(null);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const openMaterial = (material: Material) => {
    const targetUrl = material.file_path || material.url;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  if (loading || adminLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <Button onClick={() => navigate("/menu")} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-foreground">Materiais Didáticos</h1>
          </div>
          {isAdmin && <CreateCategoryDialog onCreated={fetchCategories} />}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialog({ type: 'category', id: category.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {category.materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer group"
                    onClick={() => openMaterial(material)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {getMaterialIcon(material.type)}
                      <span className="text-sm truncate">{material.name}</span>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({ type: 'material', id: material.id });
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {category.materials.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhum material ainda
                  </p>
                )}
              </div>

              {isAdmin && (
                <div className="mt-4">
                  <AddMaterialDialog categoryId={category.id} onCreated={fetchCategories} />
                </div>
              )}
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma categoria criada ainda</p>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === 'category'
                ? "Tem certeza que deseja excluir esta categoria? Todos os materiais dentro dela também serão excluídos."
                : "Tem certeza que deseja excluir este material?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Materials;
