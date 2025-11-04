import { Card } from "@/components/ui/card";
import { MenuSquare, BookOpen, GraduationCap, Bell } from "lucide-react";

const Menu = () => {
  const menuItems = [
    {
      icon: BookOpen,
      title: "Materiais Didáticos",
      description: "Acesse apostilas e conteúdos",
      color: "text-primary",
    },
    {
      icon: GraduationCap,
      title: "Horários",
      description: "Consulte horários de aulas",
      color: "text-secondary",
    },
    {
      icon: Bell,
      title: "Avisos",
      description: "Notificações importantes",
      color: "text-datashow-1",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MenuSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Menu</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-muted rounded-lg ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <p className="text-center text-muted-foreground">
            Mais funcionalidades em breve...
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Menu;
