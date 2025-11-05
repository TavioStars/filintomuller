import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo-filinto-muller.png";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="text-center space-y-6 max-w-md p-8">
        <img
          src={logoImage}
          alt="Escola Estadual Senador Filinto Müller"
          className="w-64 h-64 mx-auto object-contain"
        />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo!
          </h1>
          <p className="text-primary text-xl font-medium">
            {profile.role} {profile.name}
          </p>
          <p className="text-muted-foreground text-lg">
            Escola Estadual Senador Filinto Müller
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button 
            size="lg"
            onClick={() => navigate("/scheduling")}
            className="w-full text-lg px-8 py-6 hover:scale-105 transition-transform"
          >
            Acessar Agendamento
          </Button>

          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate("/menu")}
            className="w-full text-lg px-8 py-6 hover:scale-105 transition-transform"
          >
            Ver Menu
          </Button>
        </div>

        <p className="text-sm text-muted-foreground/60 pt-4">
          Desenvolvido por Otávio Henrique 3º B 2025
        </p>
      </Card>
    </div>
  );
};

export default Index;
