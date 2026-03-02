import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Clock, Upload, Trash2, Eye, FileText, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import PdfViewer from "@/components/PdfViewer";

type Period = "matutino" | "vespertino" | "noturno";
type Level = "medio" | "fundamental";

interface Schedule {
  id: string;
  period: Period;
  level: Level;
  file_url: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",
};

const LEVEL_LABELS: Record<Level, string> = {
  medio: "Ensino Médio",
  fundamental: "Ensino Fundamental",
};

const Schedules = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<Period>("matutino");

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*");

    if (error) {
      console.error("Error fetching schedules:", error);
    } else {
      setSchedules((data || []) as Schedule[]);
    }
    setLoading(false);
  };

  const fetchPdfAsBlob = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao baixar o PDF");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const handleViewPdf = (fileUrl: string) => {
    setViewingPdf(fileUrl);
  };

  const handleOpenInNewTab = async (fileUrl: string) => {
    setPdfLoading(true);
    try {
      const blobUrl = await fetchPdfAsBlob(fileUrl);
      window.open(blobUrl, "_blank");
    } catch (error: any) {
      toast({ variant: "destructive", description: "Erro ao abrir o PDF." });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClosePdfViewer = () => {
    setViewingPdf(null);
  };

  const getSchedule = (period: Period, level: Level) => {
    return schedules.find(s => s.period === period && s.level === level);
  };

  const handleUpload = async (period: Period, level: Level, file: File) => {
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", description: "Apenas arquivos PDF são permitidos." });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", description: "Arquivo muito grande (máximo 20MB)." });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check if one already exists and delete it first
      const existing = getSchedule(period, level);
      if (existing) {
        await supabase.storage.from("schedule-files").remove([existing.file_path]);
        await supabase.from("schedules").delete().eq("id", existing.id);
      }

      const filePath = `${period}/${level}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("schedule-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("schedule-files")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("schedules")
        .insert({
          period,
          level,
          file_url: publicUrl,
          file_path: filePath,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast({ description: "Horário atualizado com sucesso!" });
      fetchSchedules();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || "Erro ao fazer upload." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    try {
      await supabase.storage.from("schedule-files").remove([schedule.file_path]);
      const { error } = await supabase.from("schedules").delete().eq("id", schedule.id);
      if (error) throw error;
      toast({ description: "Horário excluído com sucesso!" });
      fetchSchedules();
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || "Erro ao excluir." });
    }
  };

  if (adminLoading || loading) {
    return <LoadingScreen />;
  }

  const renderLevelCard = (period: Period, level: Level) => {
    const schedule = getSchedule(period, level);

    return (
      <Card key={level} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{LEVEL_LABELS[level]}</h3>
          </div>
        </div>

        {schedule ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Horário disponível</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                disabled={pdfLoading}
                onClick={() => handleViewPdf(schedule.file_url)}
              >
                <Eye className="h-4 w-4" />
                {pdfLoading ? "Carregando..." : "Visualizar"}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={pdfLoading}
                onClick={() => handleOpenInNewTab(schedule.file_url)}
              >
                <FileText className="h-4 w-4" />
                {pdfLoading ? "Carregando..." : "Abrir em nova aba"}
              </Button>
              {isAdmin && (
                <>
                  <label>
                    <Button
                      variant="outline"
                      className="gap-2 cursor-pointer"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Shield className="h-3 w-3" />
                        <Upload className="h-4 w-4" />
                        {uploading ? "Enviando..." : "Substituir"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(period, level, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Shield className="h-3 w-3" />
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir horário?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o horário de {LEVEL_LABELS[level]} - {PERIOD_LABELS[period]}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(schedule)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Não há horário definido disponível</p>
            {isAdmin && (
              <label>
                <Button
                  variant="default"
                  className="gap-2 cursor-pointer"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Shield className="h-3 w-3" />
                    <Upload className="h-4 w-4" />
                    {uploading ? "Enviando..." : "Enviar horário (PDF)"}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(period, level, f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate("/menu")}
          variant="ghost"
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Horários das Aulas</h1>
        </div>

        <Tabs value={currentPeriod} onValueChange={(v) => setCurrentPeriod(v as Period)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="matutino">Matutino</TabsTrigger>
            <TabsTrigger value="vespertino">Vespertino</TabsTrigger>
            <TabsTrigger value="noturno">Noturno</TabsTrigger>
          </TabsList>

          {(["matutino", "vespertino", "noturno"] as Period[]).map((period) => (
            <TabsContent key={period} value={period}>
              <div className="grid gap-6">
                {(["medio", "fundamental"] as Level[]).map((level) =>
                  renderLevelCard(period, level)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* PDF Viewer Dialog */}
        <Dialog open={!!viewingPdf} onOpenChange={handleClosePdfViewer}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-4">
            <DialogHeader>
              <DialogTitle>Visualizar Horário</DialogTitle>
            </DialogHeader>
            {viewingPdf && (
              <PdfViewer url={viewingPdf} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Schedules;
