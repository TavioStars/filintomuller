import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

// Validation schemas
const signInSchema = z.object({
  email: z.string().trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email muito longo"),
  password: z.string()
    .min(1, "Senha é obrigatória")
});

const signUpSchema = z.object({
  name: z.string().trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  email: z.string().trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email muito longo"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  role: z.string().min(1, "Função é obrigatória")
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, continueAsAnonymous } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roleOptions = [
    "Aluno(a)",
    "Professor(a)",
    "Coordenador(a)",
    "Diretor(a)",
    "Vice-diretor(a)",
    "Supervisor(a)",
    "Orientador(a)",
    "Secretário(a)",
    "Inspetor(a)",
    "Bibliotecário(a)",
    "Cozinheiro(a)",
    "Técnico(a)",
  ];

  useEffect(() => {
    if (user) {
      navigate("/menu");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const errors = result.error.errors.map(err => err.message).join(". ");
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: errors,
      });
      return;
    }
    
    setIsLoading(true);

    const { error } = await signIn(result.data.email, result.data.password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message,
      });
    } else {
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
      navigate("/menu");
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = signUpSchema.safeParse({ name, email, password, role });
    if (!result.success) {
      const errors = result.error.errors.map(err => err.message).join(". ");
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: errors,
      });
      return;
    }
    
    setIsLoading(true);

    const { error } = await signUp(
      result.data.email, 
      result.data.password, 
      result.data.name, 
      result.data.role
    );

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message,
      });
    } else {
      toast({
        title: "Conta criada!",
        description: "Você pode fazer login agora.",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src={logoImage}
              alt="Escola Estadual Senador Filinto Müller"
              className="w-32 h-32 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Escola Filinto Müller</CardTitle>
          <CardDescription>Entre ou cadastre-se para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
              
              <div className="mt-6">
                <Separator className="my-4" />
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    continueAsAnonymous();
                    navigate("/menu");
                  }}
                >
                  Continuar sem login
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Você poderá ver conteúdos mas não poderá fazer agendamentos
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Função na escola</Label>
                  <Select value={role} onValueChange={setRole} required>
                    <SelectTrigger id="signup-role">
                      <SelectValue placeholder="Selecione sua função" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Deve conter: 8+ caracteres, maiúsculas, minúsculas e números
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
