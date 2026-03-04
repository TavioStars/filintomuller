import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, MenuSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationsBell from "@/components/NotificationsBell";

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
  const showMobileNav = useIsPortraitOrMobile();

  const links = [
    { to: "/menu", label: "Menu", icon: MenuSquare },
    { to: "/scheduling", label: "Agendamento", icon: CalendarDays },
  ];

  const activeIndex = links.findIndex((l) => location.pathname === l.to);

  if (showMobileNav) {
    return (
      <nav className="fixed bottom-4 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4">
        <div className="relative flex items-center gap-2 rounded-full bg-card border border-border shadow-lg p-2">
          {/* Sliding indicator */}
          <div
            className="absolute top-2 left-2 w-14 h-14 rounded-full bg-gradient-primary shadow-gradient transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${activeIndex <= 0 ? 0 : 64}px)`,
            }}
          />

          {links.map((link, i) => {
            const Icon = link.icon;
            const isActive = i === activeIndex;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative z-10 flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-300",
                  isActive ? "text-white" : "text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          })}
        </div>

        <NotificationsBell />
      </nav>
    );
  }

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
        <NotificationsBell />
      </div>
    </nav>
  );
};

export default Navigation;
