import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo-filinto-muller.png";

const Index = () => {
  const navigate = useNavigate();
  const userName = "Professora Simone";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex flex-col items-center justify-center p-4 gap-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl">
        <img
          src={logo}
          alt="Escola Estadual Senador Filinto Müller"
          className="w-48 h-48 mx-auto object-contain"
        />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Bem-vindo!
          </h1>
          <p className="text-xl text-primary font-semibold">
            {userName}
          </p>
          <p className="text-muted-foreground">
            Escola Estadual Senador Filinto Müller
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate("/scheduling")}
            className="w-full h-12 text-lg"
            size="lg"
          >
            Acessar Agendamento
          </Button>
          <Button
            onClick={() => navigate("/menu")}
            variant="outline"
            className="w-full h-12 text-lg"
            size="lg"
          >
            Ver Menu
          </Button>
        </div>
      </Card>
      
      <p className="text-sm text-muted-foreground/60 text-center">
        Desenvolvido por Otávio Henrique 3°B 2025
      </p>
    </div>
  );
};

export default Index;
