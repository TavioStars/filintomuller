import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schema
const notificationSchema = z.object({
  title: z.string().trim()
    .min(1, "Título é obrigatório")
    .max(200, "Título muito longo (máximo 200 caracteres)"),
  content: z.string().trim()
    .min(1, "Conteúdo é obrigatório")
    .max(10000, "Conteúdo muito longo (máximo 10.000 caracteres)"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  links: z.array(
    z.string().url("URL inválida").or(z.literal(""))
  ).max(10, "Máximo de 10 links")
});

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// File validation function
const validateImageFile = (file: File): File => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande (máximo 5MB): ${file.name}`);
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
  }
  
  // Sanitize filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return new File([file], sanitizedName, { type: file.type });
};

export const CreateNotificationDialog = ({ onCreated }: { onCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([""]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const filteredLinks = links.filter(link => link.trim() !== "");
    const result = notificationSchema.safeParse({
      title,
      content,
      date,
      links: filteredLinks
    });
    
    if (!result.success) {
      const errors = result.error.errors.map(err => err.message).join(". ");
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: errors,
      });
      return;
    }
    
    // Validate banner image
    if (bannerImage) {
      try {
        validateImageFile(bannerImage);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro no arquivo",
          description: error instanceof Error ? error.message : "Arquivo inválido",
        });
        return;
      }
    }
    
    // Validate additional images
    for (const img of additionalImages) {
      try {
        validateImageFile(img);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro no arquivo",
          description: error instanceof Error ? error.message : "Arquivo inválido",
        });
        return;
      }
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      let bannerUrl = null;
      if (bannerImage) {
        const bannerPath = `${user.id}/${Date.now()}_${bannerImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from("notification-images")
          .upload(bannerPath, bannerImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("notification-images")
          .getPublicUrl(bannerPath);
        
        bannerUrl = publicUrl;
      }

      const additionalUrls: string[] = [];
      for (const img of additionalImages) {
        const imgPath = `${user.id}/${Date.now()}_${img.name}`;
        const { error: uploadError } = await supabase.storage
          .from("notification-images")
          .upload(imgPath, img);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("notification-images")
          .getPublicUrl(imgPath);
        
        additionalUrls.push(publicUrl);
      }

      const { error } = await supabase.from("notifications").insert({
        created_by: user.id,
        title: result.data.title,
        content: result.data.content,
        date: result.data.date,
        banner_image: bannerUrl,
        additional_images: additionalUrls.length > 0 ? additionalUrls : null,
        links: result.data.links.filter(link => link.trim() !== "").length > 0 
          ? result.data.links.filter(link => link.trim() !== "") 
          : null,
      });

      if (error) throw error;

      toast({
        title: "Notificação criada!",
        description: "A notificação foi publicada com sucesso.",
      });

      setOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      console.error("Error creating notification:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a notificação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setDate("");
    setBannerImage(null);
    setAdditionalImages([]);
    setLinks([""]);
  };

  const addLink = () => {
    setLinks([...links, ""]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Notificação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Notificação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="banner">Imagem de Banner</Label>
            <Input
              id="banner"
              type="file"
              accept="image/*"
              onChange={(e) => setBannerImage(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <Label htmlFor="additional">Imagens Adicionais (até 10)</Label>
            <Input
              id="additional"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 10);
                setAdditionalImages(files);
              }}
            />
            {additionalImages.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {additionalImages.length} imagem(ns) selecionada(s)
              </p>
            )}
          </div>

          <div>
            <Label>Links</Label>
            {links.map((link, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  placeholder="https://..."
                />
                {links.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLink} className="w-full">
              Adicionar Link
            </Button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
