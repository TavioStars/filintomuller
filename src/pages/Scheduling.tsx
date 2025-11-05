import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, ArrowLeft, Trash2, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DayModifiers } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";

type Period = "matutino" | "vespertino" | "noturno";

interface Booking {
  id: string;
  date: string;
  class_name: string;
  resource: string;
  user_id: string;
  period: Period;
  created_at: string;
  profiles?: {
    name: string;
    role: string;
  };
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
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [currentPeriod, setCurrentPeriod] = useState<Period>("matutino");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showViewBookingsDialog, setShowViewBookingsDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const currentTab = location.pathname === "/scheduling" ? "agendamento" : "menu";

  // Fetch bookings
  useEffect(() => {
    fetchBookings();

    // Realtime subscription
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles (
          name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
      return;
    }

    setBookings((data || []) as Booking[]);
    setLoading(false);
  };

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

  const handleResourceSelect = async (resourceId: string) => {
    if (selectedDate && selectedClass && user) {
      const { error } = await supabase
        .from('bookings')
        .insert({
          date: format(selectedDate, "yyyy-MM-dd"),
          class_name: `Aula ${selectedClass}`,
          resource: RESOURCES.find(r => r.id === resourceId)?.label || "",
          user_id: user.id,
          period: currentPeriod,
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao agendar",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Agendado!",
        description: "Recurso agendado com sucesso.",
      });

      setShowResourceDialog(false);
      setSelectedClass(null);
      setSelectedDate(undefined);
    }
  };

  const handleDeleteBooking = async (bookingId: string, userId: string) => {
    if (!isAdmin && user?.id !== userId) {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Você não tem permissão para excluir este agendamento.",
      });
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Removido!",
      description: "Agendamento removido com sucesso.",
    });
  };

  const getBookingsForDate = (date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter(b => b.date === dateStr && b.period === period);
  };

  const getBookingForClass = (className: string, date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter(b => b.date === dateStr && b.class_name === className && b.period === period);
  };

  const isResourceAvailable = (resourceId: string, classId: number, date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const resourceLabel = RESOURCES.find(r => r.id === resourceId)?.label || "";
    const className = `Aula ${classId}`;
    return !bookings.some(b => 
      b.date === dateStr && 
      b.class_name === className && 
      b.resource === resourceLabel && 
      b.period === period
    );
  };

  const isClassAvailable = (classId: number, date: Date, period: Period) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const className = `Aula ${classId}`;
    const classBookings = bookings.filter(b => b.date === dateStr && b.class_name === className && b.period === period);
    return classBookings.length < RESOURCES.length;
  };

  const getDateBookingStatus = (date: Date, period: Period) => {
    const dateBookings = getBookingsForDate(date, period);
    if (dateBookings.length === 0) return null;
    
    const totalPossibleBookings = CLASSES.length * RESOURCES.length; // 6 aulas x 5 recursos = 30
    const totalBookings = dateBookings.length;
    
    // Verificar se todas as aulas têm todos os recursos agendados (dia cinza indisponível)
    const allClassesFullyBooked = CLASSES.every(classItem => {
      const classBookings = dateBookings.filter(b => b.class_name === classItem.label);
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

  if (adminLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Tabs value={currentTab} className="w-full mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger 
              value="menu" 
              onClick={() => navigate("/menu")}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Menu
            </TabsTrigger>
            <TabsTrigger 
              value="agendamento"
              onClick={() => navigate("/scheduling")}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Agendamento
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
              <div className="flex flex-col lg:flex-row gap-8">
                <Card className="p-6 flex-1 flex justify-center items-start">
                  <div className="w-full max-w-md mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Selecione uma data para agendar</h2>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onDayClick={handleDayClick}
                      className="rounded-md border w-full"
                      locale={ptBR}
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                    />
                  </div>
                </Card>

                <Card className="p-6 flex-1 overflow-y-auto max-h-[600px]">
                  <h2 className="text-xl font-semibold mb-4">Agendamentos</h2>
                  <div className="space-y-3">
                    {bookings.filter(b => b.period === period).length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum agendamento ainda
                      </p>
                    ) : (
                      bookings
                        .filter(b => b.period === period)
                        .map((booking) => {
                          const resourceData = RESOURCES.find(r => r.label === booking.resource);
                          const canDelete = isAdmin || user?.id === booking.user_id;
                          return (
                            <div
                              key={booking.id}
                              className="p-4 bg-muted rounded-lg border border-border"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground">
                                    {format(new Date(booking.date), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {booking.class_name}
                                  </p>
                                  {booking.profiles && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {booking.profiles.role} - {booking.profiles.name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right flex-1">
                                  <p className={`font-medium ${resourceData?.textColor || "text-primary"}`}>
                                    {booking.resource}
                                  </p>
                                </div>
                                {canDelete && (
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteBooking(booking.id, booking.user_id)}
                                    className="shrink-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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
                const classBookings = selectedDate ? getBookingForClass(classItem.label, selectedDate, currentPeriod) : [];
                
                return (
                  <div key={classItem.id} className="space-y-2">
                    <p className="font-semibold text-lg">{classItem.label}</p>
                    {classBookings.length === 0 ? (
                      <div className="p-3 rounded-lg bg-muted border">
                        <p className="text-sm text-muted-foreground">Disponível</p>
                      </div>
                    ) : (
                      classBookings.map((booking) => {
                        const resourceColor = RESOURCES.find(r => r.label === booking.resource)?.color || "bg-muted";
                        const canDelete = isAdmin || user?.id === booking.user_id;
                        return (
                          <div key={booking.id} className={`p-3 rounded-lg border ${resourceColor}`}>
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex-1">
                                <p className="text-sm text-white font-medium">
                                  {booking.resource}
                                </p>
                                {booking.profiles && (
                                  <p className="text-xs text-white/80 mt-1">
                                    {booking.profiles.role} - {booking.profiles.name}
                                  </p>
                                )}
                              </div>
                              {canDelete && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteBooking(booking.id, booking.user_id)}
                                  className="shrink-0"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remover
                                </Button>
                              )}
                            </div>
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
