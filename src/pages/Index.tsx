import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/assets/logo-filinto-muller.png";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/menu");
    }
  }, [user, navigate]);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <img
          src={logoImage}
          alt="Escola Estadual Senador Filinto Müller"
          className="w-64 h-64 mx-auto object-contain"
        />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo!
          </h1>
          <p className="text-muted-foreground text-lg">
            Escola Estadual Senador Filinto Müller
          </p>
        </div>

        <Button 
          size="lg"
          onClick={() => navigate("/auth")}
          className="text-lg px-8 py-6 hover:scale-105 transition-transform"
        >
          Entrar no Aplicativo
        </Button>

        <p className="text-sm text-muted-foreground/60 pt-4">
          Desenvolvido por Otávio Henrique 3º B 2025
        </p>
      </div>
    </div>
  );
};

export default Index;
