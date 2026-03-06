import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend,
} from "recharts";
import {
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    Trophy,
    TrendingUp,
    Flame,
    Crown,
    FileText,
    BarChart3,
    PieChart as PieChartIcon,
    Download,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────
type Period = "matutino" | "vespertino" | "noturno" | "todos";
type HeatmapRange = "2m" | "6m" | "1a";
type ChartMode = "donut" | "bar";

// ─── MOCK DATA ────────────────────────────────────────────────
const MOCK_SUMMARY: Record<Period, { bookingsCreatedToday: number; bookingsForToday: number; bookingsThisWeek: number; topResource: string; topResourceEmoji: string }> = {
    matutino: { bookingsCreatedToday: 5, bookingsForToday: 4, bookingsThisWeek: 22, topResource: "Datashow 1", topResourceEmoji: "📽️" },
    vespertino: { bookingsCreatedToday: 4, bookingsForToday: 3, bookingsThisWeek: 18, topResource: "STE 2", topResourceEmoji: "🖥️" },
    noturno: { bookingsCreatedToday: 3, bookingsForToday: 1, bookingsThisWeek: 7, topResource: "Notebook", topResourceEmoji: "💻" },
    todos: { bookingsCreatedToday: 12, bookingsForToday: 8, bookingsThisWeek: 47, topResource: "Datashow 1", topResourceEmoji: "📽️" },
};

const MOCK_WEEKLY: Record<Period, { day: string; agendamentos: number }[]> = {
    matutino: [{ day: "Seg", agendamentos: 6 }, { day: "Ter", agendamentos: 9 }, { day: "Qua", agendamentos: 7 }, { day: "Qui", agendamentos: 11 }, { day: "Sex", agendamentos: 4 }],
    vespertino: [{ day: "Seg", agendamentos: 5 }, { day: "Ter", agendamentos: 8 }, { day: "Qua", agendamentos: 6 }, { day: "Qui", agendamentos: 9 }, { day: "Sex", agendamentos: 4 }],
    noturno: [{ day: "Seg", agendamentos: 3 }, { day: "Ter", agendamentos: 5 }, { day: "Qua", agendamentos: 5 }, { day: "Qui", agendamentos: 5 }, { day: "Sex", agendamentos: 3 }],
    todos: [{ day: "Seg", agendamentos: 14 }, { day: "Ter", agendamentos: 22 }, { day: "Qua", agendamentos: 18 }, { day: "Qui", agendamentos: 25 }, { day: "Sex", agendamentos: 11 }],
};

const MOCK_HEATMAP_DATA: Record<HeatmapRange, { class: string; matutino: number; vespertino: number; noturno: number }[]> = {
    "2m": [
        { class: "1ª Aula", matutino: 85, vespertino: 60, noturno: 30 },
        { class: "2ª Aula", matutino: 70, vespertino: 75, noturno: 25 },
        { class: "3ª Aula", matutino: 90, vespertino: 55, noturno: 45 },
        { class: "4ª Aula", matutino: 50, vespertino: 80, noturno: 60 },
        { class: "5ª Aula", matutino: 40, vespertino: 65, noturno: 70 },
        { class: "6ª Aula", matutino: 30, vespertino: 45, noturno: 55 },
    ],
    "6m": [
        { class: "1ª Aula", matutino: 78, vespertino: 55, noturno: 35 },
        { class: "2ª Aula", matutino: 65, vespertino: 70, noturno: 30 },
        { class: "3ª Aula", matutino: 82, vespertino: 50, noturno: 40 },
        { class: "4ª Aula", matutino: 55, vespertino: 72, noturno: 55 },
        { class: "5ª Aula", matutino: 45, vespertino: 60, noturno: 62 },
        { class: "6ª Aula", matutino: 35, vespertino: 48, noturno: 50 },
    ],
    "1a": [
        { class: "1ª Aula", matutino: 72, vespertino: 50, noturno: 32 },
        { class: "2ª Aula", matutino: 60, vespertino: 65, noturno: 28 },
        { class: "3ª Aula", matutino: 75, vespertino: 48, noturno: 38 },
        { class: "4ª Aula", matutino: 52, vespertino: 68, noturno: 50 },
        { class: "5ª Aula", matutino: 42, vespertino: 55, noturno: 58 },
        { class: "6ª Aula", matutino: 32, vespertino: 42, noturno: 46 },
    ],
};

const MOCK_RESOURCES: Record<Period, { name: string; value: number; color: string }[]> = {
    matutino: [
        { name: "Datashow 1", value: 14, color: "hsl(200, 70%, 50%)" },
        { name: "Datashow 2", value: 8, color: "hsl(30, 85%, 55%)" },
        { name: "Datashow 3", value: 5, color: "hsl(160, 60%, 45%)" },
        { name: "STE 2", value: 7, color: "hsl(330, 70%, 60%)" },
        { name: "Laboratório", value: 4, color: "hsl(45, 85%, 60%)" },
        { name: "Notebook", value: 3, color: "hsl(220, 60%, 55%)" },
        { name: "Sala de Reunião", value: 2, color: "hsl(280, 65%, 60%)" },
        { name: "Caixa de Som", value: 2, color: "hsl(350, 65%, 55%)" },
    ],
    vespertino: [
        { name: "STE 2", value: 10, color: "hsl(330, 70%, 60%)" },
        { name: "Datashow 1", value: 8, color: "hsl(200, 70%, 50%)" },
        { name: "Datashow 2", value: 6, color: "hsl(30, 85%, 55%)" },
        { name: "Laboratório", value: 5, color: "hsl(45, 85%, 60%)" },
        { name: "Datashow 3", value: 4, color: "hsl(160, 60%, 45%)" },
        { name: "Notebook", value: 3, color: "hsl(220, 60%, 55%)" },
        { name: "Sala de Reunião", value: 2, color: "hsl(280, 65%, 60%)" },
        { name: "Caixa de Som", value: 1, color: "hsl(350, 65%, 55%)" },
    ],
    noturno: [
        { name: "Notebook", value: 5, color: "hsl(220, 60%, 55%)" },
        { name: "Datashow 1", value: 4, color: "hsl(200, 70%, 50%)" },
        { name: "Caixa de Som", value: 3, color: "hsl(350, 65%, 55%)" },
        { name: "STE 2", value: 2, color: "hsl(330, 70%, 60%)" },
        { name: "Datashow 2", value: 2, color: "hsl(30, 85%, 55%)" },
        { name: "Datashow 3", value: 1, color: "hsl(160, 60%, 45%)" },
        { name: "Laboratório", value: 1, color: "hsl(45, 85%, 60%)" },
        { name: "Sala de Reunião", value: 1, color: "hsl(280, 65%, 60%)" },
    ],
    todos: [
        { name: "Datashow 1", value: 28, color: "hsl(200, 70%, 50%)" },
        { name: "Datashow 2", value: 18, color: "hsl(30, 85%, 55%)" },
        { name: "STE 2", value: 15, color: "hsl(330, 70%, 60%)" },
        { name: "Datashow 3", value: 12, color: "hsl(160, 60%, 45%)" },
        { name: "Laboratório", value: 10, color: "hsl(45, 85%, 60%)" },
        { name: "Notebook", value: 8, color: "hsl(220, 60%, 55%)" },
        { name: "Sala de Reunião", value: 6, color: "hsl(280, 65%, 60%)" },
        { name: "Caixa de Som", value: 5, color: "hsl(350, 65%, 55%)" },
    ],
};

const MOCK_TOP_USERS = [
    { name: "Maria Silva", role: "Professor(a)", total: 34, avatar: "MS" },
    { name: "João Santos", role: "Professor(a)", total: 28, avatar: "JS" },
    { name: "Ana Oliveira", role: "Coordenador(a)", total: 22, avatar: "AO" },
    { name: "Carlos Souza", role: "Professor(a)", total: 18, avatar: "CS" },
    { name: "Lucia Lima", role: "Professor(a)", total: 15, avatar: "LL" },
];

// ─── PERIOD LABELS ─────────────────────────────────────────────
const PERIOD_LABELS: Record<Period, string> = {
    matutino: "☀️ Matutino",
    vespertino: "🌅 Vespertino",
    noturno: "🌙 Noturno",
    todos: "📊 Todos",
};

// ─── ANIMATED COUNTER HOOK ────────────────────────────────────
function useCountUp(end: number, duration = 1200, delay = 0) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);

    useEffect(() => {
        started.current = false;
        setCount(0);
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const timeout = setTimeout(() => {
                        let start = 0;
                        const step = end / (duration / 16);
                        const interval = setInterval(() => {
                            start += step;
                            if (start >= end) {
                                setCount(end);
                                clearInterval(interval);
                            } else {
                                setCount(Math.floor(start));
                            }
                        }, 16);
                    }, delay);
                    return () => clearTimeout(timeout);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration, delay]);

    return { count, ref };
}

// ─── SUMMARY CARD ──────────────────────────────────────────────
function SummaryCard({
    title, value, subtitle, icon: Icon, delay, gradient, isText,
}: {
    title: string; value: number | string; subtitle: string; icon: React.ElementType; delay: number; gradient: string; isText?: boolean;
}) {
    const counter = typeof value === "number" ? useCountUp(value, 1200, delay) : null;
    const [visible, setVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVisible(false);
        const timeout = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timeout);
    }, [delay, value]);

    return (
        <div
            ref={counter?.ref || cardRef}
            className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
            <Card className="relative overflow-hidden group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default h-full">
                <div className={`absolute inset-0 opacity-10 ${gradient}`} />
                <CardContent className="p-5 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${gradient} shadow-md`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    {isText ? (
                        <p className="text-xl font-bold text-foreground tracking-tight leading-tight">{value}</p>
                    ) : (
                        <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{counter?.count ?? 0}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── HEAT MAP HELPERS ──────────────────────────────────────────
function getHeatColor(value: number) {
    if (value >= 80) return "bg-primary/90 text-primary-foreground";
    if (value >= 60) return "bg-primary/60 text-primary-foreground";
    if (value >= 40) return "bg-primary/35 text-foreground";
    if (value >= 20) return "bg-primary/15 text-foreground";
    return "bg-muted text-muted-foreground";
}

function getHeatLabel(value: number) {
    if (value >= 80) return "Muito Alto";
    if (value >= 60) return "Alto";
    if (value >= 40) return "Moderado";
    if (value >= 20) return "Baixo";
    return "Mínimo";
}

// ─── CUSTOM TOOLTIPS ───────────────────────────────────────────
function CustomLineTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-foreground mb-1">{label}</p>
            <p className="text-primary">{payload[0].value} agendamentos</p>
        </div>
    );
}

function CustomBarTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-foreground mb-1">{payload[0].payload.name}</p>
            <p style={{ color: payload[0].payload.color }}>{payload[0].value} agendamentos</p>
        </div>
    );
}

function CustomPieTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const { name, value, color } = payload[0].payload;
    const total = payload[0].payload.total || 1;
    return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-foreground mb-1">{name}</p>
            <p style={{ color }}>{value} agendamentos ({Math.round((value / total) * 100)}%)</p>
        </div>
    );
}

// ─── ANIMATED SECTION ──────────────────────────────────────────
function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setVisible(true), delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
            {children}
        </div>
    );
}

// ─── CUSTOM PIE LABEL ──────────────────────────────────────────
function renderCustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.06) return null;
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

// ─── MAIN DASHBOARD COMPONENT ──────────────────────────────────
const AdminDashboard = () => {
    const [period, setPeriod] = useState<Period>("todos");
    const [heatmapRange, setHeatmapRange] = useState<HeatmapRange>("2m");
    const [chartMode, setChartMode] = useState<ChartMode>("donut");
    const [isExporting, setIsExporting] = useState(false);
    const dashboardRef = useRef<HTMLDivElement>(null);

    const summary = MOCK_SUMMARY[period];
    const weeklyData = MOCK_WEEKLY[period];
    const resourceData = MOCK_RESOURCES[period];
    const heatmapData = MOCK_HEATMAP_DATA[heatmapRange];
    const peakDay = weeklyData.reduce((max, d) => (d.agendamentos > max.agendamentos ? d : max), weeklyData[0]);

    // Add total to pie data for tooltips
    const totalResources = resourceData.reduce((sum, r) => sum + r.value, 0);
    const pieData = resourceData.map((r) => ({ ...r, total: totalResources }));

    // ─── PDF EXPORT ──────────────────────────────────────────
    const handleExportPDF = useCallback(async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#fafafa",
                logging: false,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Header
            pdf.setFillColor(18, 24, 33);
            pdf.rect(0, 0, pdfWidth, 25, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.text("Escola Senador Filinto Müller", 10, 12);
            pdf.setFontSize(10);
            const periodLabel = period === "todos" ? "Todos os Períodos" : period.charAt(0).toUpperCase() + period.slice(1);
            pdf.text(`Relatório do Dashboard — ${periodLabel} — ${new Date().toLocaleDateString("pt-BR")}`, 10, 20);

            // Image content (may span multiple pages)
            let yOffset = 30;
            let remainingHeight = imgHeight;
            let sourceY = 0;

            while (remainingHeight > 0) {
                const availableHeight = (yOffset === 30 ? pdfHeight - 35 : pdfHeight - 15);
                const sliceHeight = Math.min(remainingHeight, availableHeight);
                const sliceCanvasHeight = (sliceHeight / imgHeight) * canvas.height;

                // Create a temp canvas for this page slice
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = canvas.width;
                tempCanvas.height = sliceCanvasHeight;
                const ctx = tempCanvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceCanvasHeight, 0, 0, canvas.width, sliceCanvasHeight);
                    const sliceImgData = tempCanvas.toDataURL("image/png");
                    pdf.addImage(sliceImgData, "PNG", 10, yOffset, imgWidth, sliceHeight);
                }

                remainingHeight -= sliceHeight;
                sourceY += sliceCanvasHeight;

                if (remainingHeight > 0) {
                    pdf.addPage();
                    yOffset = 10;
                }
            }

            // Footer on last page
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text("Gerado automaticamente pelo sistema — EE Senador Filinto Müller", 10, pdfHeight - 5);

            pdf.save(`dashboard-filinto-muller-${period}-${new Date().toISOString().split("T")[0]}.pdf`);
        } catch (err) {
            console.error("Erro ao gerar PDF:", err);
        } finally {
            setIsExporting(false);
        }
    }, [period]);

    const heatmapRangeLabels: Record<HeatmapRange, string> = { "2m": "2 meses", "6m": "6 meses", "1a": "1 ano" };

    return (
        <div className="space-y-6 mt-8">
            {/* Section Header + Period Filter */}
            <AnimatedSection>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-primary">
                            <Flame className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Dashboard de Agendamentos</h2>
                            <p className="text-sm text-muted-foreground">Visão geral dos recursos da escola</p>
                        </div>
                    </div>

                    {/* Period Filter */}
                    <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-auto">
                        <TabsList className="h-9">
                            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                                <TabsTrigger key={p} value={p} className="text-xs px-3 h-7">
                                    {PERIOD_LABELS[p]}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </AnimatedSection>

            {/* Everything inside dashboardRef for PDF export */}
            <div ref={dashboardRef} className="space-y-6">
                {/* ─── SUMMARY CARDS ─────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        title="Agendamentos Feitos Hoje"
                        value={summary.bookingsCreatedToday}
                        subtitle="Reservas criadas hoje"
                        icon={CalendarCheck}
                        delay={0}
                        gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                    />
                    <SummaryCard
                        title="Agendamentos Para Hoje"
                        value={summary.bookingsForToday}
                        subtitle="Marcados para hoje"
                        icon={CalendarClock}
                        delay={100}
                        gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                    />
                    <SummaryCard
                        title="Agendamentos da Semana"
                        value={summary.bookingsThisWeek}
                        subtitle="Total semanal"
                        icon={CalendarDays}
                        delay={200}
                        gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    />
                    <SummaryCard
                        title="Recurso Mais Disputado"
                        value={`${summary.topResourceEmoji} ${summary.topResource}`}
                        subtitle="Mais requisitado do mês"
                        icon={Trophy}
                        delay={300}
                        gradient="bg-gradient-to-br from-purple-500 to-purple-700"
                        isText
                    />
                </div>

                {/* ─── ROW: LINE CHART (WIDE) + RESOURCE CHART ──── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Line Chart — takes 3 cols (wider) */}
                    <AnimatedSection delay={100} className="lg:col-span-3">
                        <Card className="overflow-hidden h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        Picos Semanais
                                    </CardTitle>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                        Pico: {peakDay.day} ({peakDay.agendamentos})
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">Agendamentos por dia da semana</p>
                            </CardHeader>
                            <CardContent className="pt-2 pb-4">
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(82, 55%, 60%)" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="hsl(82, 55%, 60%)" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="day" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 12 }} axisLine={{ stroke: "hsl(215, 15%, 88%)" }} />
                                        <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 12 }} axisLine={{ stroke: "hsl(215, 15%, 88%)" }} />
                                        <Tooltip content={<CustomLineTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="agendamentos"
                                            stroke="hsl(82, 55%, 60%)"
                                            strokeWidth={3}
                                            fill="url(#colorAgendamentos)"
                                            dot={{ r: 5, fill: "hsl(82, 55%, 60%)", stroke: "white", strokeWidth: 2 }}
                                            activeDot={{ r: 7, fill: "hsl(82, 55%, 60%)", stroke: "white", strokeWidth: 3 }}
                                            animationDuration={1500}
                                            animationEasing="ease-out"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </AnimatedSection>

                    {/* Resource Distribution — takes 2 cols (smaller) */}
                    <AnimatedSection delay={200} className="lg:col-span-2">
                        <Card className="overflow-hidden h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-primary" />
                                        Distribuição por Recurso
                                    </CardTitle>
                                    {/* Chart mode toggle */}
                                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                        <button
                                            onClick={() => setChartMode("donut")}
                                            className={`p-1.5 rounded-md transition-all ${chartMode === "donut" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                            title="Gráfico de Rosca"
                                        >
                                            <PieChartIcon className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setChartMode("bar")}
                                            className={`p-1.5 rounded-md transition-all ${chartMode === "bar" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                            title="Gráfico de Barras"
                                        >
                                            <BarChart3 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Agendamentos por tipo de recurso</p>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                {chartMode === "donut" ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={95}
                                                paddingAngle={3}
                                                dataKey="value"
                                                labelLine={false}
                                                label={renderCustomPieLabel}
                                                animationDuration={1500}
                                                animationBegin={200}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomPieTooltip />} />
                                            <Legend
                                                wrapperStyle={{ fontSize: "11px" }}
                                                formatter={(value: string) => <span className="text-foreground text-xs">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={resourceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                            <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 9 }} axisLine={{ stroke: "hsl(215, 15%, 88%)" }} angle={-45} textAnchor="end" height={70} />
                                            <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 12 }} axisLine={{ stroke: "hsl(215, 15%, 88%)" }} />
                                            <Tooltip content={<CustomBarTooltip />} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
                                                {resourceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                </div>

                {/* ─── ROW: HEAT MAP (WIDE) + TOP USERS ────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Heat Map — 3 cols */}
                    <AnimatedSection delay={300} className="lg:col-span-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Flame className="h-4 w-4 text-orange-500" />
                                            Mapa de Calor — Horários
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">Ocupação por aula e período (%)</p>
                                    </div>
                                    {/* Time range filter */}
                                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                        {(["2m", "6m", "1a"] as HeatmapRange[]).map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => setHeatmapRange(range)}
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${heatmapRange === range ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                            >
                                                {heatmapRangeLabels[range]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left text-xs font-semibold text-muted-foreground pb-3 pr-3">Aula</th>
                                                <th className="text-center text-xs font-semibold text-muted-foreground pb-3 px-2">☀️ Matutino</th>
                                                <th className="text-center text-xs font-semibold text-muted-foreground pb-3 px-2">🌅 Vespertino</th>
                                                <th className="text-center text-xs font-semibold text-muted-foreground pb-3 px-2">🌙 Noturno</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {heatmapData.map((row, i) => (
                                                <tr key={row.class}>
                                                    <td className="text-sm font-medium text-foreground py-1.5 pr-3 whitespace-nowrap">{row.class}</td>
                                                    {(["matutino", "vespertino", "noturno"] as const).map((p) => (
                                                        <td key={p} className="px-1.5 py-1.5">
                                                            <div
                                                                className={`group relative rounded-lg p-3 text-center transition-all duration-300 hover:scale-105 cursor-default ${getHeatColor(row[p])}`}
                                                            >
                                                                <span className="text-sm font-bold">{row[p]}%</span>
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                                                    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap">
                                                                        <p className="font-semibold text-foreground">{row.class} — {p.charAt(0).toUpperCase() + p.slice(1)}</p>
                                                                        <p className="text-muted-foreground">Ocupação: {row[p]}% ({getHeatLabel(row[p])})</p>
                                                                        <p className="text-muted-foreground">Período: {heatmapRangeLabels[heatmapRange]}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Legend */}
                                <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-3 border-t border-border">
                                    <span className="text-xs text-muted-foreground">Ocupação:</span>
                                    {[
                                        { label: "Mínimo", cls: "bg-muted" },
                                        { label: "Baixo", cls: "bg-primary/15" },
                                        { label: "Moderado", cls: "bg-primary/35" },
                                        { label: "Alto", cls: "bg-primary/60" },
                                        { label: "Muito Alto", cls: "bg-primary/90" },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center gap-1">
                                            <div className={`w-3 h-3 rounded-sm ${item.cls}`} />
                                            <span className="text-xs text-muted-foreground">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </AnimatedSection>

                    {/* Top Users — 2 cols */}
                    <AnimatedSection delay={400} className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-amber-500" />
                                    Top Usuários
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Quem mais agenda recursos</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2.5">
                                    {MOCK_TOP_USERS.map((user, index) => {
                                        const medals = ["🥇", "🥈", "🥉"];
                                        const barWidth = (user.total / MOCK_TOP_USERS[0].total) * 100;
                                        return (
                                            <div
                                                key={user.name}
                                                className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-300"
                                            >
                                                <div className="w-7 text-center shrink-0">
                                                    {index < 3 ? <span className="text-lg">{medals[index]}</span> : <span className="text-xs font-bold text-muted-foreground">{index + 1}º</span>}
                                                </div>
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center shrink-0">
                                                    <span className="text-white text-xs font-bold">{user.avatar}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.role}</p>
                                                        </div>
                                                        <span className="text-lg font-bold text-foreground tabular-nums ml-2">{user.total}</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out" style={{ width: `${barWidth}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                </div>
            </div>

            {/* ─── EXPORT BUTTON ─────────────────────────────────── */}
            <AnimatedSection delay={500}>
                <div className="flex justify-center pt-2 pb-4">
                    <Button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        variant="outline"
                        size="lg"
                        className="gap-3 px-8 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                    >
                        {isExporting ? (
                            <>
                                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Gerando relatório...
                            </>
                        ) : (
                            <>
                                <Download className="h-5 w-5 group-hover:animate-bounce" />
                                Gerar Relatório PDF
                            </>
                        )}
                    </Button>
                </div>
            </AnimatedSection>
        </div>
    );
};

export default AdminDashboard;
