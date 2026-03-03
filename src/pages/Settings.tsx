import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun, LogOut, Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, isAnonymous, user } = useAuth();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setIsDark(theme === "dark");
    if (theme === "dark") document.documentElement.classList.add("dark");

    // Load push preference
    const loadPushPref = async () => {
      if (user) {
        const { data } = await supabase.from("profiles").select("push_enabled").eq("id", user.id).single();
        setPushEnabled(data?.push_enabled || false);
      }
    };
    loadPushPref();
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
      // Turning on
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
      // Turning off
      setPushEnabled(false);
      localStorage.setItem("push_enabled", "false");
      if (user) {
        await supabase.from("profiles").update({ push_enabled: false } as any).eq("id", user.id);
      }
      toast({ title: "Notificações desativadas" });
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
    </div>
  );
};

export default Settings;
