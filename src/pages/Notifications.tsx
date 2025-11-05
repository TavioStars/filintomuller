import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";
import feiraProf from "@/assets/feira-profissoes.jpeg";

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
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
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Quarta feira 5 de novembro</h3>
                <p className="text-foreground">Feira das profissões na Unigran!</p>
              </div>
              <img 
                src={feiraProf}
                alt="Feira das Profissões Unigran 2025"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
