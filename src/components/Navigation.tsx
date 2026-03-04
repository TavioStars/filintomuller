import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, MenuSquare, Bell, X, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const useIsPortraitOrMobile = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => setShow(window.innerWidth < 768 || window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    const mql = window.matchMedia("(orientation: portrait)");
    mql.addEventListener("change", check);
    return () => {
      window.removeEventListener("resize", check);
      mql.removeEventListener("change", check);
    };
  }, []);
  return show;
};

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showMobileNav = useIsPortraitOrMobile();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useInAppNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  // Only show unread notifications in the mobile popover
  const unreadNotifications = notifications.filter(n => !n.read);

  const links = [
    { to: "/menu", label: "Menu", icon: MenuSquare },
    { to: "/scheduling", label: "Agendamento", icon: CalendarDays },
  ];

  const activeIndex = links.findIndex((l) => location.pathname === l.to);
  const notifActive = notifOpen;
  const effectiveActive = notifActive ? 2 : activeIndex;

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.type === "new_notification" && notif.data?.notification_id) {
      navigate(`/notifications/${notif.data.notification_id}`);
    }
    setNotifOpen(false);
  };

  const handleDismiss = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    markAsRead(notifId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (showMobileNav) {
    return (
      <nav className="fixed bottom-4 left-0 right-0 z-50 flex items-center justify-center px-4">
        <div className="relative flex items-center gap-2 rounded-full bg-card border border-border shadow-lg p-2">
          {/* Sliding indicator */}
          <div
            className="absolute top-2 left-2 w-14 h-14 rounded-full bg-gradient-primary shadow-gradient transition-all duration-300 ease-in-out"
            style={{
              transform: `translateX(${effectiveActive <= 0 ? 0 : effectiveActive * 64}px)`,
              opacity: effectiveActive >= 0 ? 1 : 0,
            }}
          />

          {links.map((link, i) => {
            const Icon = link.icon;
            const isActive = i === effectiveActive;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setNotifOpen(false)}
                className={cn(
                  "relative z-10 flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-300",
                  isActive ? "text-white" : "text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          })}

          {/* Notifications icon */}
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "relative z-10 flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-300",
                  notifActive ? "text-white" : "text-muted-foreground"
                )}
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" side="top" sideOffset={12}>
              <div className="flex items-center justify-between p-3 border-b">
                <p className="font-semibold text-sm">Notificações</p>
                {unreadNotifications.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={handleMarkAllAsRead}>
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-72">
                {unreadNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem notificações novas</p>
                ) : (
                  unreadNotifications.map(notif => (
                    <div
                      key={notif.id}
                      className="p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors bg-primary/5"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {new Date(notif.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDismiss(e, notif.id)}
                          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                          aria-label="Dispensar notificação"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </nav>
    );
  }

  // Desktop: don't render anything (tabs are already in the page)
  return null;
};

export default Navigation;
