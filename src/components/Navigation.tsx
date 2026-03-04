import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, MenuSquare, Bell } from "lucide-react";
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

  const links = [
    { to: "/menu", label: "Menu", icon: MenuSquare },
    { to: "/scheduling", label: "Agendamento", icon: CalendarDays },
  ];

  const activeIndex = links.findIndex((l) => location.pathname === l.to);
  // For notifications, activeIndex will be -1 when popover is open but we track separately
  const notifActive = notifOpen;
  const effectiveActive = notifActive ? 2 : activeIndex;

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.type === "new_notification" && notif.data?.notification_id) {
      navigate(`/notifications/${notif.data.notification_id}`);
    }
    setNotifOpen(false);
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

          {/* Notifications icon inline */}
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
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
                    Marcar todas como lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-72">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem notificações</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {new Date(notif.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
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

  // Desktop: standard nav (hidden on mobile via parent usage)
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:static md:border-0 md:bg-transparent">
      <div className="flex justify-around md:justify-center md:gap-4 p-2 items-center">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-6 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-gradient-primary text-white shadow-gradient"
                  : "text-muted-foreground hover:text-primary hover:bg-gradient-start"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs md:text-sm font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
