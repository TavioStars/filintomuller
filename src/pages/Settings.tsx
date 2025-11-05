import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const Settings = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setIsDark(theme === "dark");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate("/menu")}
          variant="ghost"
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-5 w-5 text-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-foreground" />
              )}
              <div>
                <Label htmlFor="theme-toggle" className="text-base font-medium cursor-pointer">
                  Modo Escuro
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alternar entre modo claro e escuro
                </p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={toggleTheme}
            />
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground/60">
            Desenvolvido por Otávio Henrique 3º B 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
