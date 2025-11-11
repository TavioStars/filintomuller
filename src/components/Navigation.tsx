import { Link, useLocation } from "react-router-dom";
import { CalendarDays, MenuSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();

  const links = [
    { to: "/menu", label: "Menu", icon: MenuSquare },
    { to: "/scheduling", label: "Agendamento", icon: CalendarDays },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:static md:border-0 md:bg-transparent">
      <div className="flex justify-around md:justify-center md:gap-4 p-2">
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
