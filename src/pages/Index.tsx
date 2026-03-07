import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import logoImage from "@/assets/logo-filinto-muller.png";
import {
  Calendar,
  BookOpen,
  Download,
  Smartphone,
  Share,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 18) return "🌤️";
  return "🌙";
}

const Index = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSTutorial, setShowIOSTutorial] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(isStandalone());
    const mql = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setDeferredPrompt(null); setIsPWA(true); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!user && !isAnonymous) { navigate("/auth"); return; }
    if (isAnonymous) { setLoading(false); return; }
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("name, role").eq("id", user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user, isAnonymous, navigate]);

  useEffect(() => {
    if (!loading) { const timer = setTimeout(() => setMounted(true), 50); return () => clearTimeout(timer); }
  }, [loading]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") { setDeferredPrompt(null); setIsPWA(true); }
    } else if (isIOS()) {
      setShowIOSTutorial(true);
    }
  };

  if (loading) return <LoadingScreen />;

  const firstName = profile?.name?.split(" ")[0] || "";
  const greeting = getGreeting();
  const emoji = getGreetingEmoji();
  const showInstallButton = !isPWA && (deferredPrompt || isIOS());

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full bg-secondary/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[30%] left-[10%] w-48 h-48 rounded-full bg-primary/3 blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className={`relative z-10 w-full max-w-lg space-y-6 transition-all duration-1000 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="text-center space-y-4">
          <div className={`transition-all duration-700 delay-100 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
            <img src={logoImage} alt="Escola Estadual Senador Filinto Müller" className="w-52 h-52 mx-auto object-contain drop-shadow-lg" />
          </div>
          <div className={`space-y-2 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-lg text-muted-foreground flex items-center justify-center gap-2">
              <span>{emoji}</span><span>{greeting}!</span>
            </p>
            {profile && <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{firstName}</h1>}
            {isAnonymous && <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Visitante</h1>}
            <p className="text-muted-foreground text-sm">Escola Estadual Senador Filinto Müller</p>
          </div>
        </div>

        <div className={`space-y-3 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {!isAnonymous && (
            <Card className="group cursor-pointer overflow-hidden border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300" onClick={() => navigate("/scheduling")}>
              <div className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shrink-0">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg">Acessar Agendamento</h3>
                  <p className="text-sm text-muted-foreground">Reserve recursos para suas aulas</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          )}
          <Card className="group cursor-pointer overflow-hidden hover:shadow-md hover:border-border transition-all duration-300" onClick={() => navigate("/menu")}>
            <div className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/60 shadow-md shrink-0">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">Ver Menu</h3>
                <p className="text-sm text-muted-foreground">Horários, notificações e mais</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        </div>

        {showInstallButton && (
          <div className={`transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <button onClick={handleInstallClick} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 text-sm font-medium">
              <Download className="h-4 w-4" /><span>Instalar Aplicativo</span><Sparkles className="h-3.5 w-3.5 opacity-60" />
            </button>
          </div>
        )}

        {showIOSTutorial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowIOSTutorial(false)}>
            <Card className="max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Smartphone className="h-5 w-5 text-primary" /></div>
                <h3 className="text-lg font-semibold text-foreground">Instalar no iPhone/iPad</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold text-primary">1</span></div>
                  <div><p className="text-sm text-foreground">Toque no botão de <strong>compartilhar</strong></p><p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Share className="h-3.5 w-3.5" /> O ícone de quadrado com seta para cima</p></div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold text-primary">2</span></div>
                  <div><p className="text-sm text-foreground">Role para baixo e toque em <strong>"Adicionar à Tela Inicial"</strong></p><p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> O ícone de quadrado com o sinal de +</p></div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold text-primary">3</span></div>
                  <p className="text-sm text-foreground">Toque em <strong>"Adicionar"</strong> para confirmar</p>
                </div>
              </div>
              <Button onClick={() => setShowIOSTutorial(false)} className="w-full">Entendi!</Button>
            </Card>
          </div>
        )}

        <p className={`text-center text-xs text-muted-foreground/50 pt-2 transition-all duration-700 delay-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
          Desenvolvido por Otávio Henrique 3º B 2025
        </p>
      </div>
    </div>
  );
};

export default Index;
