import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const materialSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  type: z.enum(['video', 'link', 'file']),
  url: z.string().url("URL inválida").optional().or(z.literal("")),
});

interface AddMaterialDialogProps {
  categoryId: string;
  onCreated: () => void;
}

export function AddMaterialDialog({ categoryId, onCreated }: AddMaterialDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"video" | "link" | "file">("video");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  const fetchYouTubeTitle = async (videoId: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      return data.title || null;
    } catch {
      return null;
    }
  };

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande (máximo 10MB): ${file.name}`);
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = name;
    let finalUrl = url;

    if (type === "video" && url) {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        toast({ variant: "destructive", description: "URL do YouTube inválida" });
        return;
      }
      if (!name) {
        const title = await fetchYouTubeTitle(videoId);
        if (title) finalName = title;
      }
      finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    const result = materialSchema.safeParse({ name: finalName, type, url: finalUrl });
    if (!result.success) {
      toast({ variant: "destructive", description: result.error.errors[0].message });
      return;
    }

    if (type === "file" && !file) {
      toast({ variant: "destructive", description: "Selecione um arquivo" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let filePath = null;
      if (type === "file" && file) {
        validateFile(file);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('material-files')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('material-files')
          .getPublicUrl(fileName);
        
        filePath = publicUrl;
      }

      const { error } = await supabase
        .from("materials")
        .insert({
          category_id: categoryId,
          name: result.data.name,
          type: result.data.type,
          url: type === "file" ? null : result.data.url || null,
          file_path: filePath,
          created_by: user.id,
        });

      if (error) throw error;

      toast({ description: "Material adicionado com sucesso!" });
      setName("");
      setUrl("");
      setFile(null);
      setOpen(false);
      onCreated();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || "Erro ao adicionar material" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Vídeo do YouTube</SelectItem>
                <SelectItem value="link">Link/Site</SelectItem>
                <SelectItem value="file">Arquivo (PDF/Imagem)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === "video" || type === "link") && (
            <>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={type === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
                  type="url"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome (opcional para vídeos do YouTube)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Deixe vazio para usar título do vídeo"
                />
              </div>
            </>
          )}

          {type === "file" && (
            <>
              <div>
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo 10MB. Formatos: PDF, JPG, PNG, GIF, WEBP
                </p>
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do arquivo"
                />
              </div>
            </>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
