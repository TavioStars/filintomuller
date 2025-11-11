import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import logoImage from "@/assets/logo-filinto-muller.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !isAnonymous) {
      navigate("/auth");
      return;
    }

    if (isAnonymous) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, isAnonymous, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="text-center space-y-6 max-w-md p-8 shadow-gradient">
        <img
          src={logoImage}
          alt="Escola Estadual Senador Filinto Müller"
          className="w-64 h-64 mx-auto object-contain"
        />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo!
          </h1>
          {profile && (
            <>
              <p className="text-gradient text-xl font-medium">
                {profile.role} {profile.name}
              </p>
              <p className="text-muted-foreground text-lg">
                Escola Estadual Senador Filinto Müller
              </p>
            </>
          )}
          {isAnonymous && (
            <p className="text-muted-foreground text-lg">
              Modo Anônimo
            </p>
          )}
        </div>

        <div className="space-y-3 pt-4">
          {!isAnonymous && (
            <Button 
              size="lg"
              variant="gradient"
              onClick={() => navigate("/scheduling")}
              className="w-full text-lg px-8 py-6 hover:scale-105 transition-transform"
            >
              Acessar Agendamento
            </Button>
          )}

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
