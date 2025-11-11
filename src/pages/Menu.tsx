import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Clock, Settings, ArrowLeft, BookOpen, Calendar, GraduationCap, Shield } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const currentTab = location.pathname === "/scheduling" ? "agendamento" : "menu";

  const menuItems = [
    {
      title: "Horários",
      description: "Consulte horários de aulas",
      icon: Clock,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      path: "/schedules",
    },
    {
      title: "Notificações",
      description: "Veja eventos e avisos",
      icon: Bell,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      path: "/notifications",
    },
    {
      title: "Materiais Didáticos",
      description: "Acesse vídeos e conteúdos",
      icon: GraduationCap,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10",
      path: "/materials",
    },
    {
      title: "Configurações",
      description: "Ajuste suas preferências",
      icon: Settings,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10",
      path: "/settings",
    },
  ];

  const adminItem = {
    title: "Painel de Administrador",
    description: "Gerenciar usuários e acessos",
    icon: Shield,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-600/10",
    path: "/admin",
  };

  const allMenuItems = isAdmin ? [...menuItems, adminItem] : menuItems;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Tabs value={currentTab} className="w-full mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger 
              value="menu" 
              onClick={() => navigate("/menu")}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Menu
            </TabsTrigger>
            <TabsTrigger 
              value="agendamento"
              onClick={() => navigate("/scheduling")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Agendamento
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-8 w-8 text-gradient-end" />
          <h1 className="text-3xl font-bold text-gradient">Menu</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.path}
                className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-border/50"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${item.iconBg} rounded-lg`}>
                      <Icon className={`h-6 w-6 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground/60">
            Desenvolvido por Otávio Henrique 3º B 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
