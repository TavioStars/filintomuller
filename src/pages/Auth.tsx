import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import logoImage from "@/assets/logo-filinto-muller.png";

const signInSchema = z.object({
  email: z.string().trim().min(1, "Email é obrigatório").email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(1, "Senha é obrigatória")
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().min(1, "Email é obrigatório").email("Email inválido").max(255, "Email muito longo"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  role: z.string().min(1, "Função é obrigatória")
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signOut, user, continueAsAnonymous } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAccessRequestDialog, setShowAccessRequestDialog] = useState(false);

  const roleOptions = [
    "Aluno(a)", "Professor(a)", "Coordenador(a)", "Diretor(a)", "Vice-diretor(a)",
    "Supervisor(a)", "Orientador(a)", "Secretário(a)", "Inspetor(a)", 
    "Bibliotecário(a)", "Cozinheiro(a)", "Técnico(a)",
  ];

  useEffect(() => {
    if (user) navigate("/menu");
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      toast({ variant: "destructive", title: "Erro de validação", description: result.error.errors.map(err => err.message).join(". ") });
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(result.data.email, result.data.password);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao entrar", description: error.message });
      setIsLoading(false);
      return;
    }

    // Check account status
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", authUser.id)
        .single();

      if (profile?.status === "pending") {
        navigate("/access-pending");
        setIsLoading(false);
        return;
      }

      if (profile?.status === "denied") {
        await signOut();
        toast({ 
          variant: "destructive", 
          title: "Acesso Negado", 
          description: "Sua conta foi negada pelo administrador. Entre em contato com a escola para mais informações." 
        });
        setIsLoading(false);
        return;
      }
    }

    toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
    navigate("/menu");
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signUpSchema.safeParse({ name, email, password, role });
    if (!result.success) {
      toast({ variant: "destructive", title: "Erro de validação", description: result.error.errors.map(err => err.message).join(". ") });
      return;
    }
    setIsLoading(true);

    try {
      // Create account
      const { error: signUpError } = await signUp(result.data.email, result.data.password, result.data.name, result.data.role);
      
      if (signUpError) {
        toast({ variant: "destructive", title: "Erro ao cadastrar", description: signUpError.message });
        setIsLoading(false);
        return;
      }

      // If role is not "Aluno(a)", create access request and set status to pending
      if (result.data.role !== "Aluno(a)") {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (newUser) {
          // Update profile to pending status
          await supabase
            .from("profiles")
            .update({ 
              pending_approval: true,
              status: "pending"
            })
            .eq("id", newUser.id);

          // Create access request
          await supabase
            .from("access_requests")
            .insert({
              user_id: newUser.id,
              email: result.data.email,
              name: result.data.name,
              requested_role: result.data.role,
              status: "pending",
            });

          setShowAccessRequestDialog(true);
        }
      } else {
        toast({ title: "Conta criada!", description: "Você pode fazer login agora." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-gradient">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Escola Estadual Senador Filinto Müller" className="w-32 h-32 object-contain" />
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
                  <Input id="signin-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>{isLoading ? "Entrando..." : "Entrar"}</Button>
              </form>
              
              <div className="mt-6">
                <Separator className="my-4" />
                <Button variant="ghost" className="w-full" onClick={() => { continueAsAnonymous(); navigate("/menu"); }}>
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
                  <Input id="signup-name" type="text" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Função na escola</Label>
                  <Select value={role} onValueChange={setRole} required>
                    <SelectTrigger id="signup-role"><SelectValue placeholder="Selecione sua função" /></SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (<SelectItem key={option} value={option}>{option}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Deve conter: 8+ caracteres, maiúsculas, minúsculas e números</p>
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>{isLoading ? "Cadastrando..." : "Cadastrar"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showAccessRequestDialog} onOpenChange={setShowAccessRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido de Acesso Enviado</DialogTitle>
            <DialogDescription>
              Seu pedido de acesso foi enviado e está aguardando aprovação de um administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Você será redirecionado para a tela de aguardo. Seu acesso será liberado após a aprovação.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowAccessRequestDialog(false);
              navigate("/access-pending");
            }}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
