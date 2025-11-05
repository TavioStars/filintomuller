import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Bell, Clock, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/assets/logo-filinto-muller.png";

const Menu = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <img
            src={logoImage}
            alt="Escola Filinto Müller"
            className="w-32 h-32 mx-auto object-contain"
          />
          <h1 className="text-3xl font-bold text-foreground">Menu Principal</h1>
        </div>

        <div className="grid gap-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-16 text-lg hover:bg-accent"
            onClick={() => navigate("/scheduling")}
          >
            <Calendar className="h-6 w-6" />
            Agendamento
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-16 text-lg hover:bg-accent"
            onClick={() => navigate("/schedules")}
          >
            <Clock className="h-6 w-6" />
            Horários
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-16 text-lg hover:bg-accent"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-6 w-6" />
            Notificações
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-16 text-lg hover:bg-accent"
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-6 w-6" />
            Configurações
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-16 text-lg hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-6 w-6" />
            Sair
          </Button>
        </div>

        <p className="text-sm text-muted-foreground/60 text-center pt-4">
          Feito por Otávio do 3 B 2025
        </p>
      </div>
    </div>
  );
};

export default Menu;
