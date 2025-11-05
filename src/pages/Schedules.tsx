import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import horarioEnsinoMedio from "@/assets/horario-ensino-medio.jpg";

const Schedules = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  if (selectedLevel === "medio") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setSelectedLevel(null)}
            variant="ghost"
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Horários - Ensino Médio</h1>
          </div>

          <Card className="p-4 overflow-hidden">
            <img 
              src={horarioEnsinoMedio} 
              alt="Horários do Ensino Médio"
              className="w-full h-auto rounded-lg"
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
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
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Horários das Aulas</h1>
        </div>

        <div className="grid gap-6">
          <Card
            onClick={() => setSelectedLevel("medio")}
            className="p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
          >
            <h3 className="font-semibold text-lg mb-2">Ensino Médio</h3>
            <p className="text-muted-foreground text-sm">
              Visualizar horários do ensino médio
            </p>
          </Card>

          <Card className="p-6 bg-muted/50 opacity-60 cursor-not-allowed">
            <h3 className="font-semibold text-lg mb-2">Ensino Fundamental</h3>
            <p className="text-muted-foreground text-sm">
              Não disponível no momento
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedules;
