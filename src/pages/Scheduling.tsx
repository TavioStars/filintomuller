import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DayModifiers } from "react-day-picker";

type Period = "matutino" | "vespertino" | "noturno";

interface Booking {
  date: string;
  class: number;
  resource: string;
  user: string;
  period: Period;
}

const CLASSES = [
  { id: 1, label: "Aula 1" },
  { id: 2, label: "Aula 2" },
  { id: 3, label: "Aula 3" },
  { id: 4, label: "Aula 4" },
  { id: 5, label: "Aula 5" },
  { id: 6, label: "Aula 6" },
];

const RESOURCES = [
  { id: "meeting-room", label: "Sala de Reunião", color: "bg-meeting-room hover:bg-meeting-room/90", textColor: "text-meeting-room" },
  { id: "datashow-1", label: "Datashow 1", color: "bg-datashow-1 hover:bg-datashow-1/90", textColor: "text-datashow-1" },
  { id: "datashow-2", label: "Datashow 2", color: "bg-datashow-2 hover:bg-datashow-2/90", textColor: "text-datashow-2" },
  { id: "computer-room", label: "Sala de Informática", color: "bg-computer-room hover:bg-computer-room/90", textColor: "text-computer-room" },
  { id: "laboratory", label: "Laboratório", color: "bg-laboratory hover:bg-laboratory/90", textColor: "text-laboratory" },
];

const Scheduling = () => {
  const navigate = useNavigate();
  const [currentPeriod, setCurrentPeriod] = useState<Period>("matutino");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showViewBookingsDialog, setShowViewBookingsDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const currentUser = "Professora Simone";

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowActionDialog(true);
    }
  };

  const handleViewBookings = () => {
    setShowActionDialog(false);
    setShowViewBookingsDialog(true);
  };

  const handleScheduleNew = () => {
    setShowActionDialog(false);
    setShowClassDialog(true);
  };

  const handleClassSelect = (classId: number) => {
    setSelectedClass(classId);
    setShowClassDialog(false);
    setShowResourceDialog(true);
  };

  const handleResourceSelect = (resourceId: string) => {
    if (selectedDate && selectedClass) {
      const newBooking: Booking = {
        date: format(selectedDate, "yyyy-MM-dd"),
        class: selectedClass,
        resource: RESOURCES.find(r => r.id === resourceId)?.label || "",
        user: currentUser,
        period: currentPeriod,
      };
      setBookings([...bookings, newBooking]);
      setShowResourceDialog(false);
      setSelectedClass(null);
      setSelectedDate(undefined);
    }
  };

  const getBookingsForDate = (date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter(b => b.date === dateStr && b.period === period);
  };

  const getBookingForClass = (classId: number, date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter(b => b.date === dateStr && b.class === classId && b.period === period);
  };

  const isResourceAvailable = (resourceId: string, classId: number, date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const resourceLabel = RESOURCES.find(r => r.id === resourceId)?.label || "";
    return !bookings.some(b => 
      b.date === dateStr && 
      b.class === classId && 
      b.resource === resourceLabel && 
      b.period === period
    );
  };

  const isClassAvailable = (classId: number, date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const classBookings = bookings.filter(b => b.date === dateStr && b.class === classId && b.period === period);
    // A aula só está indisponível se todos os 5 recursos foram agendados
    return classBookings.length < RESOURCES.length;
  };

  const getDateBookingStatus = (date: Date, period: Period) => {
    const dateBookings = getBookingsForDate(date, period);
    if (dateBookings.length === 0) return null;
    
    const totalPossibleBookings = CLASSES.length * RESOURCES.length; // 6 aulas x 5 recursos = 30
    const totalBookings = dateBookings.length;
    
    // Verificar se todas as aulas têm todos os recursos agendados (dia cinza indisponível)
    const allClassesFullyBooked = CLASSES.every(classItem => {
      const classBookings = dateBookings.filter(b => b.class === classItem.id);
      return classBookings.length === RESOURCES.length;
    });
    
    if (allClassesFullyBooked) return "unavailable";
    
    // Sistema de cores baseado em quantidade total de agendamentos
    if (totalBookings <= 6) return "low"; // Verde
    if (totalBookings <= 12) return "medium"; // Amarelo
    return "high"; // Vermelho (13-30)
  };

  const modifiers = {
    low: (date: Date) => getDateBookingStatus(date, currentPeriod) === "low",
    medium: (date: Date) => getDateBookingStatus(date, currentPeriod) === "medium",
    high: (date: Date) => getDateBookingStatus(date, currentPeriod) === "high",
    unavailable: (date: Date) => getDateBookingStatus(date, currentPeriod) === "unavailable",
  };

  const modifiersClassNames = {
    low: "bg-primary/20 text-primary font-bold hover:bg-primary/30",
    medium: "bg-laboratory/20 text-laboratory font-bold hover:bg-laboratory/30",
    high: "bg-destructive/20 text-destructive font-bold hover:bg-destructive/30",
    unavailable: "bg-muted text-muted-foreground font-bold opacity-50 cursor-not-allowed",
  };

  const handleDayClick = (day: Date, modifiers: DayModifiers) => {
    if (modifiers.unavailable) return;
    handleDateSelect(day);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate("/menu")}
          variant="ghost"
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Agendamento</h1>
        </div>

        <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as Period)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="matutino">Matutino</TabsTrigger>
            <TabsTrigger value="vespertino">Vespertino</TabsTrigger>
            <TabsTrigger value="noturno">Noturno</TabsTrigger>
          </TabsList>

          {(["matutino", "vespertino", "noturno"] as Period[]).map((period) => (
            <TabsContent key={period} value={period} className="mt-0">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="p-6 flex justify-center items-start">
                  <div className="w-full">
                    <h2 className="text-xl font-semibold mb-4">Selecione uma data para agendar</h2>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onDayClick={handleDayClick}
                      className="rounded-md border mx-auto scale-110 md:scale-125"
                      locale={ptBR}
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                    />
                  </div>
                </Card>

                <Card className="p-6 overflow-y-auto max-h-[600px]">
                  <h2 className="text-xl font-semibold mb-4">Agendamentos</h2>
                  <div className="space-y-3">
                    {bookings.filter(b => b.period === period).length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum agendamento ainda
                      </p>
                    ) : (
                      bookings
                        .filter(b => b.period === period)
                        .reverse()
                        .map((booking, index) => {
                          const resourceData = RESOURCES.find(r => r.label === booking.resource);
                          return (
                            <div
                              key={index}
                              className="p-4 bg-muted rounded-lg border border-border"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {format(new Date(booking.date), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Aula {booking.class}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`font-medium ${resourceData?.textColor || "text-primary"}`}>
                                    {booking.resource}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{booking.user}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Action Selection Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>O que deseja fazer?</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Button
                onClick={handleViewBookings}
                variant="outline"
                className="h-16 text-lg hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Ver agendamentos para o dia
              </Button>
              <Button
                onClick={handleScheduleNew}
                variant="outline"
                className="h-16 text-lg hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Agendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Bookings Dialog */}
        <Dialog open={showViewBookingsDialog} onOpenChange={setShowViewBookingsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Agendamentos - {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4 max-h-[400px] overflow-y-auto">
              {CLASSES.map((classItem) => {
                const classBookings = selectedDate ? getBookingForClass(classItem.id, selectedDate, currentPeriod) : [];
                
                return (
                  <div key={classItem.id} className="space-y-2">
                    <p className="font-semibold text-lg">{classItem.label}</p>
                    {classBookings.length === 0 ? (
                      <div className="p-3 rounded-lg bg-muted border">
                        <p className="text-sm text-muted-foreground">Disponível</p>
                      </div>
                    ) : (
                      classBookings.map((booking, idx) => {
                        const resourceColor = RESOURCES.find(r => r.label === booking.resource)?.color || "bg-muted";
                        return (
                          <div key={idx} className={`p-3 rounded-lg border ${resourceColor}`}>
                            <p className="text-sm text-white font-medium">
                              {booking.resource} agendado por: {booking.user}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Class Selection Dialog */}
        <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Selecione a Aula</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4 max-h-[500px] overflow-y-auto">
              {CLASSES.map((classItem) => {
                const isAvailable = selectedDate ? isClassAvailable(classItem.id, selectedDate, currentPeriod) : true;
                return (
                  <Button
                    key={classItem.id}
                    onClick={() => isAvailable && handleClassSelect(classItem.id)}
                    variant="outline"
                    disabled={!isAvailable}
                    className={`h-16 text-lg transition-colors ${
                      isAvailable 
                        ? "hover:bg-primary hover:text-primary-foreground" 
                        : "opacity-50 cursor-not-allowed bg-muted"
                    }`}
                  >
                    {classItem.label}
                    {!isAvailable && <span className="ml-2 text-xs">(Indisponível)</span>}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Resource Selection Dialog */}
        <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Selecione o Recurso</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {RESOURCES.map((resource) => {
                const isAvailable = selectedDate && selectedClass 
                  ? isResourceAvailable(resource.id, selectedClass, selectedDate, currentPeriod)
                  : true;
                
                return (
                  <Button
                    key={resource.id}
                    onClick={() => isAvailable && handleResourceSelect(resource.id)}
                    disabled={!isAvailable}
                    className={`h-16 text-lg text-white font-semibold ${
                      isAvailable 
                        ? resource.color 
                        : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {resource.label}
                    {!isAvailable && <span className="ml-2 text-xs">(Indisponível)</span>}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Scheduling;
