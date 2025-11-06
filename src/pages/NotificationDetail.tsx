import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
}

const NotificationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setNotification(data);
      } catch (error) {
        console.error("Error fetching notification:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchNotification();
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Notificação não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => navigate("/notifications")} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-4">{notification.title}</h1>

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Publicado em: {new Date(notification.published_at).toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            
            {notification.event_date && (
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Calendar className="h-5 w-5" />
                <span>Evento em: {new Date(notification.event_date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
          </div>

          {notification.banner_image && (
            <img
              src={notification.banner_image}
              alt={notification.title}
              className="w-full h-auto rounded-lg mb-6"
            />
          )}

          <p className="text-foreground whitespace-pre-wrap mb-6">{notification.content}</p>

          {notification.additional_images && notification.additional_images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {notification.additional_images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Imagem ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {notification.links && notification.links.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Links:</p>
              {notification.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {link}
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NotificationDetail;
