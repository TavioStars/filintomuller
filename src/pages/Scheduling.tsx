import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  date: string;
  class: number;
  resource: string;
  user: string;
}

const CLASSES = [
  { id: 1, label: "Aula 1" },
  { id: 2, label: "Aula 2" },
  { id: 3, label: "Aula 3" },
  { id: 4, label: "Aula 4" },
  { id: 5, label: "Aula 5" },
];

const RESOURCES = [
  { id: "meeting-room", label: "Sala de Reunião", color: "bg-meeting-room hover:bg-meeting-room/90" },
  { id: "datashow-1", label: "Datashow 1", color: "bg-datashow-1 hover:bg-datashow-1/90" },
  { id: "datashow-2", label: "Datashow 2", color: "bg-datashow-2 hover:bg-datashow-2/90" },
];

const Scheduling = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showViewBookingsDialog, setShowViewBookingsDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const currentUser = "Professor Silva"; // Mock user

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
      };
      setBookings([...bookings, newBooking]);
      setShowResourceDialog(false);
      setSelectedClass(null);
      setSelectedDate(undefined);
    }
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter(b => b.date === dateStr);
  };

  const getBookingForClass = (classId: number, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.find(b => b.date === dateStr && b.class === classId);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <CalendarDays className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Agendamento</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Selecione uma data para agendar</h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              locale={ptBR}
            />
          </Card>

          <Card className="p-6 overflow-y-auto max-h-[600px]">
            <h2 className="text-xl font-semibold mb-4">Agendamentos</h2>
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum agendamento ainda
                </p>
              ) : (
                bookings.map((booking, index) => (
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
                        <p className="font-medium text-primary">{booking.resource}</p>
                        <p className="text-sm text-muted-foreground">{booking.user}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

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
                const booking = selectedDate ? getBookingForClass(classItem.id, selectedDate) : null;
                const resourceColor = booking 
                  ? RESOURCES.find(r => r.label === booking.resource)?.color 
                  : "bg-muted";
                
                return (
                  <div
                    key={classItem.id}
                    className={`p-4 rounded-lg border ${resourceColor || "bg-muted"}`}
                  >
                    <p className="font-semibold text-lg text-white mb-1">{classItem.label}</p>
                    {booking ? (
                      <p className="text-sm text-white/90">
                        {booking.resource} agendado por: {booking.user}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Disponível</p>
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
            <div className="grid gap-3 py-4">
              {CLASSES.map((classItem) => (
                <Button
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem.id)}
                  variant="outline"
                  className="h-16 text-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {classItem.label}
                </Button>
              ))}
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
              {RESOURCES.map((resource) => (
                <Button
                  key={resource.id}
                  onClick={() => handleResourceSelect(resource.id)}
                  className={`h-16 text-lg text-white font-semibold ${resource.color}`}
                >
                  {resource.label}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Scheduling;
