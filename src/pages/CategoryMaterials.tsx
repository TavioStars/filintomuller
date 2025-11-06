import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ExternalLink, FileText, Image as ImageIcon, Video } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { AddMaterialDialog } from "@/components/AddMaterialDialog";
import { useAdmin } from "@/hooks/useAdmin";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Material {
  id: string;
  name: string;
  type: "video" | "link" | "file";
  url: string | null;
  file_path: string | null;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const isPdf = (path: string | null): boolean => !!path && /\.pdf($|\?)/i.test(path);
const isImage = (path: string | null): boolean => !!path && /(\.png|\.jpe?g|\.gif|\.webp)($|\?)/i.test(path);

const CategoryMaterials = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [category, setCategory] = useState<Category | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: catData, error: catErr }, { data: matsData, error: matsErr }] = await Promise.all([
        supabase.from("material_categories").select("*").eq("id", id).single(),
        supabase.from("materials").select("*").eq("category_id", id).order("display_order", { ascending: true }),
      ]);
      if (catErr) throw catErr;
      if (matsErr) throw matsErr;
      setCategory(catData as Category);
      setMaterials((matsData || []) as Material[]);
      // SEO basics
      if (catData?.name) document.title = `${catData.name} • Materiais`;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const items = useMemo(() => materials, [materials]);

  if (loading) return <LoadingScreen />;
  if (!category) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Categoria não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              {category.description && (
                <p className="text-muted-foreground mt-2">{category.description}</p>
              )}
            </div>
            {isAdmin && id && (
              <AddMaterialDialog categoryId={id} onCreated={fetchData} />
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((mat) => {
            const videoId = mat.type === "video" && mat.url ? extractYouTubeId(mat.url) : null;
            const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;
            const fileIsPdf = isPdf(mat.file_path);
            const fileIsImage = isImage(mat.file_path);

            return (
              <Card key={mat.id} className="overflow-hidden group">
                <button
                  onClick={() => window.open(mat.file_path || mat.url || "#", "_blank")}
                  className="w-full text-left"
                  aria-label={`Abrir material ${mat.name}`}
                >
                  <div className="aspect-[16/9] bg-muted flex items-center justify-center overflow-hidden">
                    {videoId && thumbnail && (
                      <img src={thumbnail} alt={mat.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    {!videoId && fileIsImage && mat.file_path && (
                      <img src={mat.file_path} alt={mat.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    {!videoId && fileIsPdf && mat.file_path && (
                      <object data={mat.file_path} type="application/pdf" className="w-full h-full">
                        <div className="flex items-center justify-center w-full h-full">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </object>
                    )}
                    {!videoId && !fileIsImage && !fileIsPdf && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {mat.type === "link" ? (
                          <ExternalLink className="h-6 w-6" />
                        ) : mat.type === "file" ? (
                          <FileText className="h-6 w-6" />
                        ) : (
                          <ImageIcon className="h-6 w-6" />
                        )}
                        <span className="text-sm">Prévia indisponível</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {mat.type === "video" && <Video className="h-3 w-3" />}
                      {mat.type === "file" && <FileText className="h-3 w-3" />}
                      {mat.type === "link" && <ExternalLink className="h-3 w-3" />}<span className="uppercase">{mat.type}</span>
                    </div>
                    <p className="font-medium truncate" title={mat.name}>{mat.name}</p>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <Card className="p-8 text-center mt-4">
            <p className="text-muted-foreground">Nenhum material nesta categoria</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CategoryMaterials;
