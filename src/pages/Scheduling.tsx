import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, ArrowLeft, Trash2, BookOpen, Calendar as CalendarIcon, Shield, Plus, Filter, Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DayModifiers } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import { Badge } from "@/components/ui/badge";
import NavigationBar from "@/components/Navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Period = "matutino" | "vespertino" | "noturno";

interface Booking {
  id: string;
  date: string;
  class_name: string;
  resource: string;
  user_id: string;
  period: Period;
  created_at: string;
  profiles?: { name: string; role: string };
}

interface ResourceItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: string;
}

const CLASSES = [
  { id: 1, label: "1ª Aula" },
  { id: 2, label: "2ª Aula" },
  { id: 3, label: "3ª Aula" },
  { id: 4, label: "4ª Aula" },
  { id: 5, label: "5ª Aula" },
  { id: 6, label: "6ª Aula" },
];

const Scheduling = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAnonymous } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [currentPeriod, setCurrentPeriod] = useState<Period>("matutino");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);
  const [bookingsTab, setBookingsTab] = useState<"day" | "recent">("day");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const lastClickedDate = useRef<string | null>(null);
  const currentTab = location.pathname === "/scheduling" ? "agendamento" : "menu";

  // Fetch resources from DB
  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase
        .from("resources")
        .select("id, name, emoji, color, status")
        .order("display_order");
      if (data) setResources(data);
    };
    fetchResources();
    const channel = supabase.channel('resources-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => fetchResources())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Available resources (not in maintenance)
  const availableResources = resources.filter(r => r.status === "disponivel");

  useEffect(() => {
    fetchBookings();
    const channel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, profiles (name, role)`)
      .order('created_at', { ascending: false });
    if (error) { console.error('Error fetching bookings:', error); setLoading(false); return; }
    setBookings((data || []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setIsStudent(profile?.role === "Aluno(a)");
      } else { setIsStudent(false); }
    };
    checkUserRole();
  }, [user]);

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleDayClick = (day: Date, modifiers: DayModifiers) => {
    if (modifiers.unavailable) return;
    const localDate = new Date(day);
    localDate.setHours(0, 0, 0, 0);
    const dateStr = formatDateStr(localDate);
    if (lastClickedDate.current === dateStr && !isStudent && !isAnonymous) {
      setShowActionDialog(true);
      lastClickedDate.current = null;
    } else {
      setSelectedDate(localDate);
      setBookingsTab("day");
      lastClickedDate.current = dateStr;
    }
  };

  const handleScheduleNew = async () => {
    if (isAnonymous) { toast({ variant: "destructive", title: "Acesso negado", description: "Você precisa fazer login para agendar recursos." }); return; }
    if (isStudent) { toast({ variant: "destructive", title: "Acesso negado", description: "Alunos não podem agendar recursos." }); return; }
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
      const formattedDate = formatDateStr(selectedDate);
      const className = CLASSES.find(c => c.id === selectedClass)?.label || "";
      const resource = availableResources.find(r => r.id === resourceId);
      const resourceLabel = resource?.name || "";

      const { data: existingBooking } = await supabase
        .from('bookings').select('id')
        .eq('date', formattedDate).eq('class_name', className)
        .eq('resource', resourceLabel).eq('period', currentPeriod)
        .maybeSingle();

      if (existingBooking) {
        toast({ variant: "destructive", title: "Recurso já agendado", description: "Este recurso já está agendado para esta aula." });
        return;
      }

      const { error } = await supabase.from('bookings').insert({
        date: formattedDate, class_name: className, resource: resourceLabel, user_id: user.id, period: currentPeriod,
      });

      if (error) { toast({ variant: "destructive", title: "Erro ao agendar", description: error.message }); return; }
      toast({ title: "Agendado! ✅", description: "Recurso agendado com sucesso." });
      setShowResourceDialog(false);
      setSelectedClass(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string, bookingUserId: string, bookingResource: string, bookingDate: string) => {
    if (!isAdmin && user?.id !== bookingUserId) {
      toast({ variant: "destructive", title: "Acesso negado", description: "Você não tem permissão para excluir este agendamento." });
      return;
    }
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) { toast({ variant: "destructive", title: "Erro ao remover", description: error.message }); return; }

    if (isAdmin && user?.id !== bookingUserId) {
      const { data: adminProfile } = await supabase.from("profiles").select("name").eq("id", user!.id).single();
      await supabase.from('in_app_notifications').insert({
        user_id: bookingUserId, type: 'booking_deleted', title: 'Agendamento removido',
        body: `Seu agendamento de ${bookingResource} em ${bookingDate} foi removido pelo administrador ${adminProfile?.name || 'Admin'}.`,
        data: { booking_id: bookingId, admin_name: adminProfile?.name || 'Admin' },
      });
    }
    toast({ title: "Removido!", description: "Agendamento removido com sucesso." });
  };

  const getBookingsForDate = (date: Date, period: Period) => {
    const dateStr = formatDateStr(date);
    return bookings.filter(b => b.date === dateStr && b.period === period);
  };

  const isResourceAvailable = (resourceId: string, classId: number, date: Date, period: Period) => {
    const dateStr = formatDateStr(date);
    const resource = availableResources.find(r => r.id === resourceId);
    const resourceLabel = resource?.name || "";
    const className = CLASSES.find(c => c.id === classId)?.label || "";
    return !bookings.some(b => b.date === dateStr && b.class_name === className && b.resource === resourceLabel && b.period === period);
  };

  const isClassAvailable = (classId: number, date: Date, period: Period) => {
    const dateStr = formatDateStr(date);
    const className = CLASSES.find(c => c.id === classId)?.label || "";
    const classBookings = bookings.filter(b => b.date === dateStr && b.class_name === className && b.period === period);
    return classBookings.length < availableResources.length;
  };

  const getDateBookingStatus = (date: Date, period: Period) => {
    const dateBookings = getBookingsForDate(date, period);
    if (dateBookings.length === 0) return null;
    const totalBookings = dateBookings.length;
    const allClassesFullyBooked = CLASSES.every(classItem => {
      const cb = dateBookings.filter(b => b.class_name === classItem.label);
      return cb.length === availableResources.length;
    });
    if (allClassesFullyBooked) return "unavailable";
    if (totalBookings <= 6) return "low";
    if (totalBookings <= 20) return "medium";
    return "high";
  };

  const modifiers = {
    low: (date: Date) => getDateBookingStatus(date, currentPeriod) === "low",
    medium: (date: Date) => getDateBookingStatus(date, currentPeriod) === "medium",
    high: (date: Date) => getDateBookingStatus(date, currentPeriod) === "high",
    unavailable: (date: Date) => getDateBookingStatus(date, currentPeriod) === "unavailable",
  };

  const modifiersClassNames = {
    low: "!bg-primary/20 text-primary font-bold hover:!bg-primary/30 !rounded-md",
    medium: "!bg-yellow-500/25 text-yellow-700 dark:text-yellow-400 font-bold hover:!bg-yellow-500/35 !rounded-md",
    high: "!bg-destructive/20 text-destructive font-bold hover:!bg-destructive/30 !rounded-md",
    unavailable: "!bg-muted text-muted-foreground font-bold opacity-50 cursor-not-allowed !rounded-md",
  };

  const dayBookings = getBookingsForDate(selectedDate, currentPeriod);
  const filteredDayBookings = resourceFilter === "all" ? dayBookings : dayBookings.filter(b => b.resource === resourceFilter);
  const recentBookings = bookings.filter(b => b.period === currentPeriod);
  const filteredRecentBookings = resourceFilter === "all" ? recentBookings : recentBookings.filter(b => b.resource === resourceFilter);

  const monthlyTotal = bookings.filter(b => {
    const [y, m] = b.date.split('-');
    return parseInt(y) === selectedDate.getFullYear() && parseInt(m) === selectedDate.getMonth() + 1 && b.period === currentPeriod;
  }).length;

  const dailyResourceCounts = resources.map(r => ({
    ...r,
    count: dayBookings.filter(b => b.resource === r.name).length,
  }));

  const getResourceData = (resourceName: string) => resources.find(r => r.name === resourceName);

  if (adminLoading || loading) return <LoadingScreen />;

  const renderBookingCard = (booking: Booking, context: "day" | "recent" = "day") => {
    const resourceData = getResourceData(booking.resource);
    const canDelete = isAdmin || user?.id === booking.user_id;
    const [y, m, d] = booking.date.split('-');
    const dateDisplay = `${d}/${m}/${y}`;
    const isAdminDeletingOther = isAdmin && user?.id !== booking.user_id;

    const createdDate = booking.created_at
      ? new Date(booking.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Campo_Grande' })
      : null;
    const createdTime = booking.created_at
      ? new Date(booking.created_at).toLocaleTimeString('pt-BR', { timeZone: 'America/Campo_Grande', hour: '2-digit', minute: '2-digit' })
      : null;

    const periodLabel = booking.period === "matutino" ? "Matutino" : booking.period === "vespertino" ? "Vespertino" : "Noturno";

    return (
      <div key={booking.id} className="p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{resourceData?.emoji || "📋"}</span>
              <span className="font-semibold" style={{ color: resourceData?.color }}>{booking.resource}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-foreground">{booking.class_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">{dateDisplay}</p>
              {context === "day" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-sm space-y-1.5">
                    <p className="font-semibold text-foreground">Detalhes do Agendamento</p>
                    <p><span className="text-muted-foreground">Recurso:</span> {booking.resource}</p>
                    <p><span className="text-muted-foreground">Aula:</span> {booking.class_name}</p>
                    <p><span className="text-muted-foreground">Período:</span> {periodLabel}</p>
                    {booking.profiles && <p><span className="text-muted-foreground">Agendado por:</span> {booking.profiles.name}</p>}
                    {createdDate && createdTime && <p><span className="text-muted-foreground">Criado em:</span> {createdDate} às {createdTime}</p>}
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {context === "recent" && createdDate && createdTime && (
              <p className="text-xs text-muted-foreground">Agendado em {createdDate} às {createdTime}</p>
            )}
            {booking.profiles && (
              <p className="text-xs text-muted-foreground mt-1">👤 {booking.profiles.role} — {booking.profiles.name}</p>
            )}
          </div>
          {canDelete && !isStudent && !isAnonymous && (
            <Button
              variant="destructive"
              size={isAdminDeletingOther ? "sm" : "icon"}
              className={isAdminDeletingOther ? "shrink-0 h-8 px-2 gap-1" : "shrink-0 h-8 w-8"}
              onClick={() => handleDeleteBooking(booking.id, booking.user_id, booking.resource, `${d}/${m}/${y}`)}
            >
              {isAdminDeletingOther && <Shield className="h-3 w-3" />}
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <Button onClick={() => navigate("/")} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="hidden md:block">
          <Tabs value={currentTab} className="w-full mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="menu" onClick={() => navigate("/menu")} className="gap-2"><BookOpen className="h-4 w-4" /> Menu</TabsTrigger>
              <TabsTrigger value="agendamento" onClick={() => navigate("/scheduling")} className="gap-2"><CalendarIcon className="h-4 w-4" /> Agendamento</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="h-8 w-8 text-gradient-end" />
          <h1 className="text-3xl font-bold text-foreground">Agendamento</h1>
        </div>

        <Tabs value={currentPeriod} onValueChange={(v) => setCurrentPeriod(v as Period)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="matutino">☀️ Matutino</TabsTrigger>
            <TabsTrigger value="vespertino">🌅 Vespertino</TabsTrigger>
            <TabsTrigger value="noturno">🌙 Noturno</TabsTrigger>
          </TabsList>

          {(["matutino", "vespertino", "noturno"] as Period[]).map((period) => (
            <TabsContent key={period} value={period} className="mt-0">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-[380px] space-y-4">
                  <Card className="p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onDayClick={handleDayClick}
                      className="rounded-md border w-full"
                      locale={ptBR}
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                    />
                  </Card>

                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Data selecionada</p>
                    <p className="text-lg font-bold text-foreground">
                      {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {dayBookings.length} agendamento{dayBookings.length !== 1 ? 's' : ''}
                    </p>
                    {!isStudent && !isAnonymous && (
                      <Button className="w-full mt-3 gap-2" onClick={() => setShowClassDialog(true)}>
                        <Plus className="h-4 w-4" /> Novo agendamento
                      </Button>
                    )}
                  </Card>

                  <Card className="p-4">
                    <p className="text-sm font-semibold text-foreground mb-3">Recursos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {resources.map(r => (
                        <div key={r.id} className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                          <span className="text-muted-foreground">{r.emoji} {r.name}</span>
                          {r.status === "manutencao" && <span className="text-destructive text-[10px]">🔧</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="flex-1 min-w-0">
                  <Card className="p-4">
                    <Tabs value={bookingsTab} onValueChange={(v) => setBookingsTab(v as "day" | "recent")}>
                      <TabsList className="w-full grid grid-cols-2 mb-4">
                        <TabsTrigger value="day" className="gap-2"><CalendarIcon className="h-4 w-4" /> Do Dia</TabsTrigger>
                        <TabsTrigger value="recent" className="gap-2"><Clock className="h-4 w-4" /> Últimos</TabsTrigger>
                      </TabsList>

                      <ScrollArea className="w-full mb-4">
                        <div className="flex gap-2 pb-2">
                          <Button variant={resourceFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setResourceFilter("all")} className="shrink-0 text-xs">
                            <Filter className="h-3 w-3 mr-1" /> Todos
                          </Button>
                          {resources.map(r => (
                            <Button key={r.id} variant={resourceFilter === r.name ? "default" : "outline"} size="sm" onClick={() => setResourceFilter(r.name)} className="shrink-0 text-xs">
                              {r.emoji} {r.name}
                            </Button>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>

                      <TabsContent value="day" className="mt-0">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-foreground">{format(selectedDate, "dd/MM/yyyy")}</h3>
                          <Badge variant="secondary">{filteredDayBookings.length} agend.</Badge>
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {filteredDayBookings.length === 0 ? (
                            <div className="text-center py-12">
                              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                              <p className="text-muted-foreground">Não há agendamentos para este dia{resourceFilter !== "all" && ` (${resourceFilter})`}</p>
                            </div>
                          ) : filteredDayBookings.map(b => renderBookingCard(b, "day"))}
                        </div>
                      </TabsContent>

                      <TabsContent value="recent" className="mt-0">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-foreground">Últimos agendamentos</h3>
                          <Badge variant="secondary">{filteredRecentBookings.length}</Badge>
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                          {filteredRecentBookings.length === 0 ? (
                            <div className="text-center py-12">
                              <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                              <p className="text-muted-foreground">Nenhum agendamento ainda</p>
                            </div>
                          ) : filteredRecentBookings.map(b => renderBookingCard(b, "recent"))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </Card>
                </div>
              </div>

              <Card className="mt-4 p-3">
                <div className="flex flex-wrap gap-3 justify-center items-center text-xs">
                  <span className="font-semibold text-foreground">Total do mês: {monthlyTotal}</span>
                  {dailyResourceCounts.filter(r => r.count > 0).map(r => (
                    <span key={r.id} className="font-medium" style={{ color: r.color }}>
                      {r.emoji} {r.name}: {r.count}
                    </span>
                  ))}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedDate && format(selectedDate, "dd/MM/yyyy")} — O que deseja fazer?</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Button onClick={handleScheduleNew} variant="outline" disabled={isStudent} className="h-16 text-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50">
                <Plus className="h-5 w-5 mr-2" />
                {isStudent ? "Indisponível para alunos" : "Agendar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Selecione a Aula</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-4 max-h-[500px] overflow-y-auto">
              {CLASSES.map((classItem) => {
                const isAvail = selectedDate ? isClassAvailable(classItem.id, selectedDate, currentPeriod) : true;
                return (
                  <Button key={classItem.id} onClick={() => isAvail && handleClassSelect(classItem.id)} variant="outline" disabled={!isAvail}
                    className={`h-16 text-lg transition-colors ${isAvail ? "hover:bg-primary hover:text-primary-foreground" : "opacity-50 cursor-not-allowed bg-muted"}`}>
                    {classItem.label}
                    {!isAvail && <span className="ml-2 text-xs">(Indisponível)</span>}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Selecione o Recurso</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-4">
              {availableResources.map((resource) => {
                const isAvail = selectedDate && selectedClass
                  ? isResourceAvailable(resource.id, selectedClass, selectedDate, currentPeriod)
                  : true;
                return (
                  <Button key={resource.id} onClick={() => isAvail && handleResourceSelect(resource.id)} disabled={!isAvail}
                    className={`h-16 text-lg text-white font-semibold ${isAvail ? "" : "!bg-muted !text-muted-foreground opacity-50 cursor-not-allowed"}`}
                    style={isAvail ? { backgroundColor: resource.color } : undefined}>
                    {resource.emoji} {resource.name}
                    {!isAvail && <span className="ml-2 text-xs">(Indisponível)</span>}
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <NavigationBar />
    </div>
  );
};

export default Scheduling;
