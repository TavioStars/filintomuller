import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Acesso Negado</CardTitle>
          <CardDescription>
            Sua solicitação de acesso foi recusada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Um administrador revisou sua solicitação e decidiu não aprovar seu acesso à plataforma.
            Sua conta continua registrada, mas você não tem permissão para acessar o sistema.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Se você acredita que isso é um erro, entre em contato com a administração da escola.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full"
          >
            Voltar para Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
