import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Clock, Settings, ArrowLeft, BookOpen, Calendar, GraduationCap } from "lucide-react";

const Menu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname === "/scheduling" ? "agendamento" : "menu";

  const menuItems = [
    {
      title: "Horários",
      description: "Consulte horários de aulas",
      icon: Clock,
      iconColor: "text-blue-500",
      path: "/schedules",
    },
    {
      title: "Notificações",
      description: "Veja eventos e avisos",
      icon: Bell,
      iconColor: "text-amber-500",
      path: "/notifications",
    },
    {
      title: "Materiais Didáticos",
      description: "Acesse vídeos e conteúdos",
      icon: GraduationCap,
      iconColor: "text-purple-500",
      path: "/materials",
    },
    {
      title: "Configurações",
      description: "Ajuste suas preferências",
      icon: Settings,
      iconColor: "text-green-500",
      path: "/settings",
    },
  ];

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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                variant="gradient-subtle"
                className="p-6 hover:shadow-gradient hover:border-gradient-middle transition-all cursor-pointer"
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-primary rounded-lg shadow-gradient">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
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
