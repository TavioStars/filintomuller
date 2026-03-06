import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Wrench } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import LoadingScreen from "@/components/LoadingScreen";
import UsersSheet from "@/components/UsersSheet";
import ResourcesSheet from "@/components/ResourcesSheet";
import AdminDashboard from "@/components/AdminDashboard";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [showUsersSheet, setShowUsersSheet] = useState(false);
  const [showResourcesSheet, setShowResourcesSheet] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    navigate("/menu");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate("/menu")}
            variant="ghost"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowResourcesSheet(true)}
              variant="outline"
              className="gap-2"
            >
              <Wrench className="h-4 w-4" />
              Recursos
            </Button>
            <Button
              onClick={() => setShowUsersSheet(true)}
              variant="gradient"
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Usuários
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Painel de Administrador</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo ao Painel Administrativo</CardTitle>
              <CardDescription>
                Gerencie usuários, acessos e configurações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use o botão "Usuários" acima para gerenciar contas de usuários e aprovar solicitações de acesso.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard */}
        <AdminDashboard />
      </div>

      <UsersSheet open={showUsersSheet} onOpenChange={setShowUsersSheet} />
      <ResourcesSheet open={showResourcesSheet} onOpenChange={setShowResourcesSheet} />
    </div>
  );
};

export default AdminPanel;
