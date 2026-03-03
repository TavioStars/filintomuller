import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { CreateNotificationDialog } from "@/components/CreateNotificationDialog";
import LoadingScreen from "@/components/LoadingScreen";

interface Notification {
  id: string;
  title: string;
  content: string;
  published_at: string;
  event_date: string | null;
  banner_image: string | null;
  additional_images: string[] | null;
  links: string[] | null;
  created_at: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const { data, error } = await supabase.from("notifications").select("*").order("published_at", { ascending: false });
        if (error) throw error;
        setNotifications(data || []);
      } else {
        const { data, error } = await supabase.from("notifications_public" as any).select("*").order("published_at", { ascending: false });
        if (error) throw error;
        setNotifications((data || []) as unknown as Notification[]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminLoading) fetchNotifications();
  }, [adminLoading, isAdmin]);

  // Check if push notifications are enabled — show prompt if not
  useEffect(() => {
    const checkPush = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("push_enabled").eq("id", user.id).single();
      if (!data?.push_enabled) {
        setShowPushPrompt(true);
      }
    };
    checkPush();
  }, [user]);

  const handleEnablePush = async () => {
    if (!("Notification" in window)) { setShowPushPrompt(false); return; }
    const permission = await Notification.requestPermission();
    if (permission === "granted" && user) {
      localStorage.setItem("push_enabled", "true");
      await supabase.from("profiles").update({ push_enabled: true } as any).eq("id", user.id);
    }
    setShowPushPrompt(false);
  };

  if (loading || adminLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => navigate("/menu")} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-gradient-end glow-gradient rounded-full p-1" />
            <h1 className="text-3xl font-bold text-gradient">Notificações</h1>
          </div>
          {isAdmin && <CreateNotificationDialog onCreated={fetchNotifications} />}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              variant="gradient-subtle"
              className="cursor-pointer hover:shadow-gradient hover:border-gradient-middle transition-all"
              onClick={() => navigate(`/notifications/${notification.id}`)}
            >
              {notification.banner_image && (
                <img src={notification.banner_image} alt={notification.title} className="w-full h-48 object-cover rounded-t-lg" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{notification.title}</h3>
                <div className="flex flex-col gap-1 mb-3 text-xs text-muted-foreground">
                  <p>Publicado em: {new Date(notification.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  {notification.event_date && (
                    <p className="font-semibold text-gradient">
                      Evento: {new Date(notification.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <p className="text-sm text-foreground line-clamp-2">
                  {notification.content.slice(0, 100)}{notification.content.length > 100 && "..."}
                </p>
              </div>
            </Card>
          ))}

          {notifications.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma notificação no momento</p>
            </Card>
          )}
        </div>
      </div>

      {/* Push notification prompt */}
      <Dialog open={showPushPrompt} onOpenChange={setShowPushPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Ativar notificações?
            </DialogTitle>
            <DialogDescription>
              Receba alertas quando novas notificações forem publicadas ou quando um agendamento seu for removido.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button className="flex-1" onClick={handleEnablePush}>
              Ativar 🔔
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowPushPrompt(false)}>
              Agora não
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
