import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

      const filteredLinks = links.filter(link => link.trim() !== "");

      const { error } = await supabase.from("notifications").insert({
        created_by: user.id,
        title,
        content,
        date,
        banner_image: bannerUrl,
        additional_images: additionalUrls.length > 0 ? additionalUrls : null,
        links: filteredLinks.length > 0 ? filteredLinks : null,
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
