import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, CheckCircle, XCircle } from "lucide-react";
import { useAccessRequestsNotifications } from "@/hooks/useAccessRequestsNotifications";

interface Profile {
  id: string;
  name: string;
  role: string;
  pending_approval: boolean;
}

interface UserRole {
  role: string;
}

interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  name: string;
  requested_role: string;
  status: string;
  created_at: string;
}

interface UsersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UsersSheet = ({ open, onOpenChange }: UsersSheetProps) => {
  const { toast } = useToast();
  const { pendingCount } = useAccessRequestsNotifications();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedRole, setEditedRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProfiles();
      fetchAccessRequests();
    }
  }, [open]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching profiles:", error);
      return;
    }

    setProfiles(data || []);

    // Fetch user roles for all users
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesData) {
      const rolesMap: Record<string, UserRole[]> = {};
      rolesData.forEach((role) => {
        if (!rolesMap[role.user_id]) {
          rolesMap[role.user_id] = [];
        }
        rolesMap[role.user_id].push({ role: role.role });
      });
      setUserRoles(rolesMap);
    }
  };

  const fetchAccessRequests = async () => {
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching access requests:", error);
      return;
    }

    setAccessRequests(data || []);
  };

  const handleUserClick = (profile: Profile) => {
    setSelectedUser(profile);
    setEditedRole(profile.role);
    setIsAdmin(userRoles[profile.id]?.some(r => r.role === "admin") || false);
    setEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;

    setLoading(true);

    try {
      // Update profile role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: editedRole })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      // Handle admin role
      if (isAdmin && !userRoles[selectedUser.id]?.some(r => r.role === "admin")) {
        const { error: addAdminError } = await supabase.rpc("add_admin_role", {
          target_user_id: selectedUser.id,
        });
        if (addAdminError) throw addAdminError;
      } else if (!isAdmin && userRoles[selectedUser.id]?.some(r => r.role === "admin")) {
        const { error: removeAdminError } = await supabase.rpc("remove_admin_role", {
          target_user_id: selectedUser.id,
        });
        if (removeAdminError) throw removeAdminError;
      }

      toast({
        title: "Alterações salvas",
        description: "As informações do usuário foram atualizadas.",
      });

      setEditDialogOpen(false);
      fetchProfiles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAccess = async (request: AccessRequest) => {
    setLoading(true);

    try {
      // Update access request
      const { error: requestError } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (requestError) throw requestError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ pending_approval: false })
        .eq("id", request.user_id);

      if (profileError) throw profileError;

      toast({
        title: "Acesso aprovado",
        description: `O acesso de ${request.name} foi aprovado.`,
      });

      fetchAccessRequests();
      fetchProfiles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDenyAccess = async (request: AccessRequest) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "denied",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Acesso negado",
        description: `O acesso de ${request.name} foi negado.`,
      });

      fetchAccessRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao negar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[50vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gerenciar Usuários</SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="users" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="access" className="relative">
                Acessos
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs h-5">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="Aluno(a)">Aluno(a)</SelectItem>
                    <SelectItem value="Professor(a)">Professor(a)</SelectItem>
                    <SelectItem value="Coordenador(a)">Coordenador(a)</SelectItem>
                    <SelectItem value="Diretor(a)">Diretor(a)</SelectItem>
                    <SelectItem value="Vice-diretor(a)">Vice-diretor(a)</SelectItem>
                    <SelectItem value="Supervisor(a)">Supervisor(a)</SelectItem>
                    <SelectItem value="Orientador(a)">Orientador(a)</SelectItem>
                    <SelectItem value="Secretário(a)">Secretário(a)</SelectItem>
                    <SelectItem value="Inspetor(a)">Inspetor(a)</SelectItem>
                    <SelectItem value="Bibliotecário(a)">Bibliotecário(a)</SelectItem>
                    <SelectItem value="Cozinheiro(a)">Cozinheiro(a)</SelectItem>
                    <SelectItem value="Técnico(a)">Técnico(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredProfiles.map((profile) => {
                  const isUserAdmin = userRoles[profile.id]?.some(r => r.role === "admin");
                  return (
                    <Card
                      key={profile.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleUserClick(profile)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{profile.name}</p>
                            <p className="text-sm text-muted-foreground">{profile.role}</p>
                          </div>
                          {isUserAdmin && (
                            <Badge variant="default">Admin</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              {accessRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação pendente
                </p>
              ) : (
                <div className="space-y-2">
                  {accessRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">{request.name}</p>
                            <p className="text-sm text-muted-foreground">{request.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Solicitou: {request.requested_role}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(request.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveAccess(request)}
                              disabled={loading}
                              className="flex-1 gap-2"
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Permitir
                            </Button>
                            <Button
                              onClick={() => handleDenyAccess(request)}
                              disabled={loading}
                              className="flex-1 gap-2"
                              variant="destructive"
                            >
                              <XCircle className="h-4 w-4" />
                              Negar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={selectedUser?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={editedRole} onValueChange={setEditedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aluno(a)">Aluno(a)</SelectItem>
                  <SelectItem value="Professor(a)">Professor(a)</SelectItem>
                  <SelectItem value="Coordenador(a)">Coordenador(a)</SelectItem>
                  <SelectItem value="Diretor(a)">Diretor(a)</SelectItem>
                  <SelectItem value="Vice-diretor(a)">Vice-diretor(a)</SelectItem>
                  <SelectItem value="Supervisor(a)">Supervisor(a)</SelectItem>
                  <SelectItem value="Orientador(a)">Orientador(a)</SelectItem>
                  <SelectItem value="Secretário(a)">Secretário(a)</SelectItem>
                  <SelectItem value="Inspetor(a)">Inspetor(a)</SelectItem>
                  <SelectItem value="Bibliotecário(a)">Bibliotecário(a)</SelectItem>
                  <SelectItem value="Cozinheiro(a)">Cozinheiro(a)</SelectItem>
                  <SelectItem value="Técnico(a)">Técnico(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="admin-toggle"
                checked={isAdmin}
                onCheckedChange={setIsAdmin}
              />
              <Label htmlFor="admin-toggle">Administrador</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveChanges} disabled={loading}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsersSheet;
