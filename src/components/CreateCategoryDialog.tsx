import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().trim().min(1, "Descrição é obrigatória").max(500, "Descrição muito longa"),
});

interface CreateCategoryDialogProps {
  onCreated: () => void;
}

export function CreateCategoryDialog({ onCreated }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = categorySchema.safeParse({ name, description });
    if (!result.success) {
      toast({
        variant: "destructive",
        description: result.error.errors[0].message,
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("material_categories")
        .insert({
          name: result.data.name,
          description: result.data.description,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        description: "Categoria criada com sucesso!",
      });

      setName("");
      setDescription("");
      setOpen(false);
      onCreated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Erro ao criar categoria",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mega aulas para ENEM"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pedro assad"
              maxLength={500}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Categoria"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
