import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun, LogOut, Bell, BellOff, User, Camera } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AvatarCropper from "@/components/AvatarCropper";

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, isAnonymous, user } = useAuth();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [profile, setProfile] = useState<{ name: string; role: string; avatar_url: string | null } | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setIsDark(theme === "dark");
    if (theme === "dark") document.documentElement.classList.add("dark");

    const loadProfile = async () => {
      if (user) {
        const { data } = await supabase.from("profiles").select("name, role, push_enabled, avatar_url").eq("id", user.id).single();
        if (data) {
          setProfile({ name: data.name, role: data.role, avatar_url: (data as any).avatar_url || null });
          setPushEnabled(data.push_enabled || false);
        }
      }
    };
    loadProfile();
  }, [user]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const togglePushNotifications = async () => {
    if (!pushEnabled) {
      if (!("Notification" in window)) {
        toast({ variant: "destructive", title: "Não suportado", description: "Seu navegador não suporta notificações." });
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({ variant: "destructive", title: "Permissão negada", description: "Você precisa permitir notificações no navegador." });
        return;
      }
      setPushEnabled(true);
      localStorage.setItem("push_enabled", "true");
      if (user) {
        await supabase.from("profiles").update({ push_enabled: true } as any).eq("id", user.id);
      }
      toast({ title: "Notificações ativadas! 🔔" });
    } else {
      setPushEnabled(false);
      localStorage.setItem("push_enabled", "false");
      if (user) {
        await supabase.from("profiles").update({ push_enabled: false } as any).eq("id", user.id);
      }
      toast({ title: "Notificações desativadas" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCropperOpen(true);
    }
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!user) return;
    setCropperOpen(false);
    setUploading(true);

    try {
      const filePath = `${user.id}/avatar.jpg`;
      
      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([filePath]);
      
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("id", user.id);
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      toast({ title: "Foto atualizada! 📸" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao enviar foto", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => navigate("/menu")} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        </div>

        <div className="space-y-4">
          {/* Profile Section */}
          {user && !isAnonymous && profile && (
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    ) : null}
                    <AvatarFallback className="text-2xl">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.role}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="h-5 w-5 text-foreground" /> : <Sun className="h-5 w-5 text-foreground" />}
                <div>
                  <Label htmlFor="theme-toggle" className="text-base font-medium cursor-pointer">Modo Escuro</Label>
                  <p className="text-sm text-muted-foreground">Alternar entre modo claro e escuro</p>
                </div>
              </div>
              <Switch id="theme-toggle" checked={isDark} onCheckedChange={toggleTheme} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pushEnabled ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="push-toggle" className="text-base font-medium cursor-pointer">Notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    {pushEnabled ? "Notificações ativadas" : "Ative para receber alertas"}
                  </p>
                </div>
              </div>
              <Switch id="push-toggle" checked={pushEnabled} onCheckedChange={togglePushNotifications} />
            </div>
          </Card>

          <Card className="p-6">
            <Button variant="destructive" className="w-full gap-2" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
              {isAnonymous ? "Sair do Modo Anônimo" : "Sair da Conta"}
            </Button>
            {isAnonymous && (
              <p className="text-xs text-muted-foreground mt-2 text-center">Você está navegando sem login</p>
            )}
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground/60">Desenvolvido por Otávio Henrique 3º B 2025</p>
        </div>
      </div>

      <AvatarCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Settings;
