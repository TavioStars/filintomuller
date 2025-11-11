import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

const AccessPending = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApproval = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (profile?.status === "approved") {
        navigate("/menu");
        return;
      }

      if (profile?.status === "denied") {
        await signOut();
        navigate("/auth");
        return;
      }

      setLoading(false);
    };

    checkApproval();

    // Set up realtime subscription to check for status changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        async (payload) => {
          if (payload.new) {
            if (payload.new.status === "approved") {
              navigate("/menu");
            } else if (payload.new.status === "denied") {
              await signOut();
              navigate("/auth");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, signOut]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-amber-500/10 rounded-full">
              <Clock className="h-12 w-12 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Seu acesso está em análise</CardTitle>
          <CardDescription>
            Um administrador está revisando sua solicitação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Você será notificado assim que seu acesso for aprovado. Por favor, aguarde.
          </p>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Fazer Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessPending;
