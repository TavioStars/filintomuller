import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import {
    CalendarCheck, CalendarClock, CalendarDays, Trophy, TrendingUp, Flame, Crown,
    Download, BarChart3, PieChart as PieChartIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Period = "matutino" | "vespertino" | "noturno" | "todos";
type HeatmapRange = "2m" | "6m" | "1a";
type ChartMode = "donut" | "bar";
type TopUsersRange = "1m" | "3m" | "6m" | "all";

const PERIOD_LABELS: Record<Period, string> = {
    matutino: "☀️ Matutino", vespertino: "🌅 Vespertino", noturno: "🌙 Noturno", todos: "📊 Todos",
};

const CLASSES = ["1ª Aula", "2ª Aula", "3ª Aula", "4ª Aula", "5ª Aula", "6ª Aula"];

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
                            if (start >= end) { setCount(end); clearInterval(interval); }
                            else setCount(Math.floor(start));
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

function SummaryCard({ title, value, subtitle, icon: Icon, delay, gradient, isText }: {
    title: string; value: number | string; subtitle: string; icon: React.ElementType; delay: number; gradient: string; isText?: boolean;
}) {
    const counter = typeof value === "number" ? useCountUp(value, 1200, delay) : null;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(false);
        const timeout = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timeout);
    }, [delay, value]);

    return (
        <div ref={counter?.ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <Card className="relative overflow-hidden group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default h-full">
                <div className={`absolute inset-0 opacity-10 ${gradient}`} />
                <CardContent className="p-5 relative">
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${gradient} shadow-md`}><Icon className="h-5 w-5 text-white" /></div>
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
    const { name, value, color, total } = payload[0].payload;
    return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-foreground mb-1">{name}</p>
            <p style={{ color }}>{value} agendamentos ({Math.round((value / (total || 1)) * 100)}%)</p>
        </div>
    );
}

function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); }
        }, { threshold: 0.1 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay]);
    return (
        <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
            {children}
        </div>
    );
}

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

// ─── DATE HELPERS ─────────────────────────────────────────────
function getToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: fmt(monday), end: fmt(friday), monday };
}

function getMonthRange() {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
    return { start, end };
}

function getHeatmapStartDate(range: HeatmapRange) {
    const now = new Date();
    if (range === "2m") now.setMonth(now.getMonth() - 2);
    else if (range === "6m") now.setMonth(now.getMonth() - 6);
    else now.setFullYear(now.getFullYear() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ─── MAIN DASHBOARD COMPONENT ──────────────────────────────────
const AdminDashboard = () => {
    const [period, setPeriod] = useState<Period>("todos");
    const [heatmapRange, setHeatmapRange] = useState<HeatmapRange>("2m");
    const [chartMode, setChartMode] = useState<ChartMode>("donut");
    const [topUsersRange, setTopUsersRange] = useState<TopUsersRange>("all");
    const [isExporting, setIsExporting] = useState(false);
    const dashboardRef = useRef<HTMLDivElement>(null);

    // Data state
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [resources, setResources] = useState<{ name: string; emoji: string; color: string }[]>([]);
    const [topUsers, setTopUsers] = useState<{ name: string; role: string; total: number; avatar: string }[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Fetch all bookings + resources
    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            const [bookingsRes, resourcesRes] = await Promise.all([
                supabase.from("bookings").select("*, profiles(name, role)").order("created_at", { ascending: false }),
                supabase.from("resources").select("name, emoji, color").order("display_order"),
            ]);
            if (bookingsRes.data) setAllBookings(bookingsRes.data);
            if (resourcesRes.data) setResources(resourcesRes.data);
            setDataLoading(false);
        };
        fetchData();
    }, []);

    // Compute top users when bookings change, filtered by topUsersRange
    useEffect(() => {
        const userMap = new Map<string, { name: string; role: string; total: number }>();
        let filtered = period === "todos" ? allBookings : allBookings.filter(b => b.period === period);

        // Apply time range filter
        if (topUsersRange !== "all") {
            const now = new Date();
            const rangeMonths = topUsersRange === "1m" ? 1 : topUsersRange === "3m" ? 3 : 6;
            const cutoff = new Date(now.getFullYear(), now.getMonth() - rangeMonths, now.getDate());
            const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
            filtered = filtered.filter(b => b.date >= cutoffStr);
        }

        for (const b of filtered) {
            const key = b.user_id;
            const existing = userMap.get(key);
            if (existing) { existing.total++; }
            else {
                userMap.set(key, {
                    name: b.profiles?.name || "Usuário",
                    role: b.profiles?.role || "",
                    total: 1,
                });
            }
        }
        const sorted = Array.from(userMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);
        setTopUsers(sorted.map(u => ({
            ...u,
            avatar: u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        })));
    }, [allBookings, period, topUsersRange]);

    // Filter bookings by period
    const bookings = period === "todos" ? allBookings : allBookings.filter(b => b.period === period);

    // Summary
    const today = getToday();
    const bookingsCreatedToday = bookings.filter(b => b.created_at?.startsWith(today)).length;
    const bookingsForToday = bookings.filter(b => b.date === today).length;
    const { start: weekStart, end: weekEnd, monday } = getWeekRange();
    const bookingsThisWeek = bookings.filter(b => b.date >= weekStart && b.date <= weekEnd).length;

    // Top resource of the month
    const { start: monthStart, end: monthEnd } = getMonthRange();
    const monthBookings = bookings.filter(b => b.date >= monthStart && b.date <= monthEnd);
    const resourceCounts = new Map<string, number>();
    for (const b of monthBookings) {
        resourceCounts.set(b.resource, (resourceCounts.get(b.resource) || 0) + 1);
    }
    let topResource = "—";
    let topResourceEmoji = "📊";
    let topCount = 0;
    for (const [name, count] of resourceCounts) {
        if (count > topCount) { topCount = count; topResource = name; }
    }
    const resData = resources.find(r => r.name === topResource);
    if (resData) topResourceEmoji = resData.emoji;

    // Weekly chart data
    const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex"];
    const weekBookings = bookings.filter(b => b.date >= weekStart && b.date <= weekEnd);
    const weeklyData = dayNames.map((day, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return { day, agendamentos: weekBookings.filter(b => b.date === dateStr).length };
    });
    const peakDay = weeklyData.reduce((max, d) => (d.agendamentos > max.agendamentos ? d : max), weeklyData[0]);

    // Resource distribution
    const resourceDistribution = resources.map(r => ({
        name: r.name,
        value: monthBookings.filter(b => b.resource === r.name).length,
        color: r.color,
    })).filter(r => r.value > 0).sort((a, b) => b.value - a.value);
    const totalResources = resourceDistribution.reduce((sum, r) => sum + r.value, 0);
    const pieData = resourceDistribution.map(r => ({ ...r, total: totalResources }));

    // Heatmap
    const heatmapStart = getHeatmapStartDate(heatmapRange);
    const heatmapBookings = allBookings.filter(b => b.date >= heatmapStart);

    // Count working days in range
    const startD = new Date(heatmapStart);
    const endD = new Date();
    let workingDays = 0;
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow >= 1 && dow <= 5) workingDays++;
    }
    const numResources = resources.length || 8;
    const maxPerSlot = workingDays > 0 ? workingDays * numResources : 1;

    const heatmapData = CLASSES.map(cls => {
        const classBookings = heatmapBookings.filter(b => b.class_name === cls);
        return {
            class: cls,
            matutino: Math.min(100, Math.round((classBookings.filter(b => b.period === "matutino").length / maxPerSlot) * 100)),
            vespertino: Math.min(100, Math.round((classBookings.filter(b => b.period === "vespertino").length / maxPerSlot) * 100)),
            noturno: Math.min(100, Math.round((classBookings.filter(b => b.period === "noturno").length / maxPerSlot) * 100)),
        };
    });

    // PDF color helpers
    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
        s /= 100; l /= 100;
        const k = (n: number) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    };
    const getHeatRgb = (value: number): [number, number, number] => {
        if (value >= 80) return [59, 130, 246];
        if (value >= 60) return [99, 155, 246];
        if (value >= 40) return [150, 190, 250];
        if (value >= 20) return [200, 220, 250];
        return [230, 230, 235];
    };

    // PDF Export (jsPDF native drawing)
    const handleExportPDF = useCallback(async () => {
        setIsExporting(true);
        try {
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF("p", "mm", "a4");
            const W = pdf.internal.pageSize.getWidth();
            const H = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const contentW = W - margin * 2;
            let y = 0;

            const headerBg: [number, number, number] = [18, 24, 33];
            const white: [number, number, number] = [255, 255, 255];
            const dark: [number, number, number] = [30, 30, 30];
            const gray: [number, number, number] = [120, 120, 120];
            const lightGray: [number, number, number] = [245, 245, 245];
            const medGray: [number, number, number] = [200, 200, 200];
            const primaryC: [number, number, number] = [59, 130, 246];

            // Header
            pdf.setFillColor(...headerBg);
            pdf.rect(0, 0, W, 18, "F");
            pdf.setTextColor(...white);
            pdf.setFontSize(13);
            pdf.setFont("helvetica", "bold");
            pdf.text("Escola Senador Filinto Muller", margin, 8);
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");
            const periodLabel = period === "todos" ? "Todos os Periodos" : period.charAt(0).toUpperCase() + period.slice(1);
            pdf.text(`Relatorio do Dashboard - ${periodLabel} - ${new Date().toLocaleDateString("pt-BR")}`, margin, 14);
            y = 22;

            // Summary Cards
            const cardW = (contentW - 3 * 3) / 4;
            const cardH = 18;
            const summaryCards = [
                { title: "Agend. Feitos Hoje", value: String(bookingsCreatedToday), sub: "Reservas criadas hoje" },
                { title: "Agend. Para Hoje", value: String(bookingsForToday), sub: "Marcados para hoje" },
                { title: "Agend. da Semana", value: String(bookingsThisWeek), sub: "Total semanal" },
                { title: "Recurso + Disputado", value: topResource, sub: "Mais requisitado do mes" },
            ];
            summaryCards.forEach((card, i) => {
                const x = margin + i * (cardW + 3);
                pdf.setFillColor(...lightGray); pdf.roundedRect(x, y, cardW, cardH, 2, 2, "F");
                pdf.setTextColor(...gray); pdf.setFontSize(6); pdf.setFont("helvetica", "normal"); pdf.text(card.title, x + 3, y + 5);
                pdf.setTextColor(...dark); pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.text(card.value, x + 3, y + 12);
                pdf.setTextColor(...gray); pdf.setFontSize(5); pdf.setFont("helvetica", "normal"); pdf.text(card.sub, x + 3, y + 16);
            });
            y += cardH + 5;

            // Weekly Peaks + Resource Distribution
            const halfW = (contentW - 4) / 2;
            const sectionH = 52;

            // Weekly Peaks (left)
            pdf.setFillColor(...lightGray); pdf.roundedRect(margin, y, halfW, sectionH, 2, 2, "F");
            pdf.setTextColor(...dark); pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.text("Picos Semanais", margin + 4, y + 6);
            pdf.setTextColor(...gray); pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); pdf.text("Agendamentos por dia da semana", margin + 4, y + 10);
            const barAreaX = margin + 6; const barAreaY = y + 14; const barAreaW = halfW - 12; const barAreaH = sectionH - 20;
            const maxVal = Math.max(...weeklyData.map(d => d.agendamentos), 1);
            const barGap = 3; const barW = (barAreaW - barGap * (weeklyData.length - 1)) / weeklyData.length;
            weeklyData.forEach((d, i) => {
                const bh = (d.agendamentos / maxVal) * (barAreaH - 8);
                const bx = barAreaX + i * (barW + barGap);
                const by = barAreaY + barAreaH - 6 - bh;
                pdf.setFillColor(...primaryC); pdf.roundedRect(bx, by, barW, Math.max(bh, 1), 1, 1, "F");
                pdf.setTextColor(...dark); pdf.setFontSize(5.5); pdf.setFont("helvetica", "bold"); pdf.text(String(d.agendamentos), bx + barW / 2, by - 1, { align: "center" });
                pdf.setTextColor(...gray); pdf.setFontSize(5); pdf.setFont("helvetica", "normal"); pdf.text(d.day, bx + barW / 2, barAreaY + barAreaH - 1, { align: "center" });
            });

            // Resource Distribution (right)
            const rxStart = margin + halfW + 4;
            pdf.setFillColor(...lightGray); pdf.roundedRect(rxStart, y, halfW, sectionH, 2, 2, "F");
            pdf.setTextColor(...dark); pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.text("Distribuicao por Recurso", rxStart + 4, y + 6);
            pdf.setTextColor(...gray); pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); pdf.text("Agendamentos por tipo de recurso", rxStart + 4, y + 10);
            const resStartY = y + 14; const resBarMaxW = halfW - 30; const resLineH = 5.5;
            const maxResVal = Math.max(...resourceDistribution.map(x => x.value), 1);
            resourceDistribution.slice(0, 7).forEach((r, i) => {
                const ry = resStartY + i * resLineH;
                const bw = (r.value / maxResVal) * resBarMaxW;
                pdf.setTextColor(...dark); pdf.setFontSize(5); pdf.setFont("helvetica", "normal"); pdf.text(r.name, rxStart + 4, ry + 3.5);
                const hslMatch = r.color.match(/hsl\((\d+)/);
                const hue = hslMatch ? parseInt(hslMatch[1]) : 200;
                const rgb = hslToRgb(hue, 60, 50);
                pdf.setFillColor(rgb[0], rgb[1], rgb[2]); pdf.roundedRect(rxStart + 24, ry + 0.5, Math.max(bw, 1), 3.5, 0.5, 0.5, "F");
                pdf.setTextColor(...gray); pdf.setFontSize(4.5); pdf.text(String(r.value), rxStart + 25 + bw, ry + 3.5);
            });
            y += sectionH + 5;

            // Heatmap + Top Users
            const heatH = 62;

            // Heatmap (left)
            pdf.setFillColor(...lightGray); pdf.roundedRect(margin, y, halfW, heatH, 2, 2, "F");
            pdf.setTextColor(...dark); pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.text("Mapa de Calor - Horarios", margin + 4, y + 6);
            pdf.setTextColor(...gray); pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal");
            const hmRangeLabel = heatmapRange === "2m" ? "2 meses" : heatmapRange === "6m" ? "6 meses" : "1 ano";
            pdf.text(`Ocupacao por aula e periodo (%) - ${hmRangeLabel}`, margin + 4, y + 10);
            const htY = y + 14; const colW = (halfW - 30) / 3; const colX = margin + 22;
            pdf.setFontSize(5); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...gray);
            pdf.text("Matutino", colX + colW * 0.5, htY, { align: "center" });
            pdf.text("Vespertino", colX + colW * 1.5, htY, { align: "center" });
            pdf.text("Noturno", colX + colW * 2.5, htY, { align: "center" });
            heatmapData.forEach((row, i) => {
                const ry = htY + 4 + i * 7;
                pdf.setTextColor(...dark); pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal"); pdf.text(row.class, margin + 4, ry + 4);
                (["matutino", "vespertino", "noturno"] as const).forEach((p, j) => {
                    const val = row[p]; const cx = colX + j * colW;
                    const cellColor = getHeatRgb(val);
                    pdf.setFillColor(cellColor[0], cellColor[1], cellColor[2]); pdf.roundedRect(cx + 1, ry, colW - 2, 6, 1, 1, "F");
                    pdf.setTextColor(val >= 60 ? 255 : 50, val >= 60 ? 255 : 50, val >= 60 ? 255 : 50);
                    pdf.setFontSize(5.5); pdf.setFont("helvetica", "bold"); pdf.text(`${val}%`, cx + colW / 2, ry + 4, { align: "center" });
                });
            });

            // Top Users (right)
            const tuX = margin + halfW + 4;
            pdf.setFillColor(...lightGray); pdf.roundedRect(tuX, y, halfW, heatH, 2, 2, "F");
            pdf.setTextColor(...dark); pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.text("Top Usuarios", tuX + 4, y + 6);
            pdf.setTextColor(...gray); pdf.setFontSize(5.5); pdf.setFont("helvetica", "normal");
            const tuRangeLabel = topUsersRange === "1m" ? "1 mes" : topUsersRange === "3m" ? "3 meses" : topUsersRange === "6m" ? "6 meses" : "Todo o tempo";
            pdf.text(`Quem mais agenda recursos - ${tuRangeLabel}`, tuX + 4, y + 10);
            const medals = ["1o", "2o", "3o"];
            topUsers.forEach((user, i) => {
                const uy = y + 15 + i * 9;
                const barPct = topUsers[0]?.total > 0 ? (user.total / topUsers[0].total) * 100 : 0;
                pdf.setTextColor(...primaryC); pdf.setFontSize(6); pdf.setFont("helvetica", "bold");
                pdf.text(i < 3 ? medals[i] : `${i + 1}o`, tuX + 5, uy + 3);
                pdf.setTextColor(...dark); pdf.setFontSize(6); pdf.setFont("helvetica", "bold"); pdf.text(user.name, tuX + 14, uy + 2.5);
                pdf.setTextColor(...gray); pdf.setFontSize(4.5); pdf.setFont("helvetica", "normal"); pdf.text(user.role, tuX + 14, uy + 6);
                pdf.setTextColor(...dark); pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.text(String(user.total), tuX + halfW - 8, uy + 4);
                const pbX = tuX + 14; const pbW = halfW - 30; const pbY = uy + 7;
                pdf.setFillColor(...medGray); pdf.roundedRect(pbX, pbY, pbW, 1.5, 0.5, 0.5, "F");
                pdf.setFillColor(...primaryC); pdf.roundedRect(pbX, pbY, pbW * barPct / 100, 1.5, 0.5, 0.5, "F");
            });

            // Footer
            pdf.setFontSize(6); pdf.setTextColor(150, 150, 150);
            pdf.text("Gerado automaticamente pelo sistema - EE Senador Filinto Muller", margin, H - 4);
            pdf.text(new Date().toLocaleString("pt-BR"), W - margin, H - 4, { align: "right" });

            pdf.save(`dashboard-filinto-muller-${period}-${new Date().toISOString().split("T")[0]}.pdf`);
        } catch (err) { console.error("Erro ao gerar PDF:", err); }
        finally { setIsExporting(false); }
    }, [period, heatmapRange, topUsersRange, bookingsCreatedToday, bookingsForToday, bookingsThisWeek, topResource, weeklyData, resourceDistribution, heatmapData, topUsers]);

    const heatmapRangeLabels: Record<HeatmapRange, string> = { "2m": "2 meses", "6m": "6 meses", "1a": "1 ano" };

    if (dataLoading) {
        return (
            <div className="space-y-6 mt-8">
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-8">
            <AnimatedSection>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-primary"><Flame className="h-5 w-5 text-white" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Dashboard de Agendamentos</h2>
                            <p className="text-sm text-muted-foreground">Visão geral dos recursos da escola</p>
                        </div>
                    </div>
                    <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-auto">
                        <TabsList className="h-9">
                            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                                <TabsTrigger key={p} value={p} className="text-xs px-3 h-7">{PERIOD_LABELS[p]}</TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </AnimatedSection>

            <div ref={dashboardRef} className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard title="Agendamentos Feitos Hoje" value={bookingsCreatedToday} subtitle="Reservas criadas hoje" icon={CalendarCheck} delay={0} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
                    <SummaryCard title="Agendamentos Para Hoje" value={bookingsForToday} subtitle="Marcados para hoje" icon={CalendarClock} delay={100} gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
                    <SummaryCard title="Agendamentos da Semana" value={bookingsThisWeek} subtitle="Total semanal" icon={CalendarDays} delay={200} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
                    <SummaryCard title="Recurso Mais Disputado" value={`${topResourceEmoji} ${topResource}`} subtitle="Mais requisitado do mês" icon={Trophy} delay={300} gradient="bg-gradient-to-br from-purple-500 to-purple-700" isText />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <AnimatedSection delay={100} className="lg:col-span-3">
                        <Card className="overflow-hidden h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" /> Picos Semanais
                                    </CardTitle>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">Pico: {peakDay.day} ({peakDay.agendamentos})</span>
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
                                        <Area type="monotone" dataKey="agendamentos" stroke="hsl(82, 55%, 60%)" strokeWidth={3} fill="url(#colorAgendamentos)" dot={{ r: 5, fill: "hsl(82, 55%, 60%)", stroke: "white", strokeWidth: 2 }} activeDot={{ r: 7, fill: "hsl(82, 55%, 60%)", stroke: "white", strokeWidth: 3 }} animationDuration={1500} animationEasing="ease-out" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </AnimatedSection>

                    <AnimatedSection delay={200} className="lg:col-span-2">
                        <Card className="overflow-hidden h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-primary" /> Distribuição por Recurso
                                    </CardTitle>
                                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                        <button onClick={() => setChartMode("donut")} className={`p-1.5 rounded-md transition-all ${chartMode === "donut" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}><PieChartIcon className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => setChartMode("bar")} className={`p-1.5 rounded-md transition-all ${chartMode === "bar" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}><BarChart3 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Agendamentos por tipo de recurso</p>
                            </CardHeader>
                            <CardContent className="pt-0 pb-4">
                                {chartMode === "donut" ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomPieLabel} animationDuration={1500} animationBegin={200}>
                                                {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />))}
                                            </Pie>
                                            <Tooltip content={<CustomPieTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: "11px" }} formatter={(value: string) => <span className="text-foreground text-xs">{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={resourceDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                            <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 9 }} axisLine={{ stroke: "hsl(215, 15%, 88%)" }} angle={-45} textAnchor="end" height={70} />
                                            <YAxis tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 12 }} axisLine={{ stroke: "hsl(215, 15%, 88%)" }} />
                                            <Tooltip content={<CustomBarTooltip />} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
                                                {resourceDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                </div>

                {/* Heatmap + Top Users */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <AnimatedSection delay={300} className="lg:col-span-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base font-semibold flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Mapa de Calor — Horários</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">Ocupação por aula e período (%)</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                        {(["2m", "6m", "1a"] as HeatmapRange[]).map((range) => (
                                            <button key={range} onClick={() => setHeatmapRange(range)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${heatmapRange === range ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>{heatmapRangeLabels[range]}</button>
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
                                            {heatmapData.map((row) => (
                                                <tr key={row.class}>
                                                    <td className="text-sm font-medium text-foreground py-1.5 pr-3 whitespace-nowrap">{row.class}</td>
                                                    {(["matutino", "vespertino", "noturno"] as const).map((p) => (
                                                        <td key={p} className="px-1.5 py-1.5">
                                                            <div className={`group relative rounded-lg p-3 text-center transition-all duration-300 hover:scale-105 cursor-default ${getHeatColor(row[p])}`}>
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

                    <AnimatedSection delay={400} className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base font-semibold flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Top Usuários</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">Quem mais agenda recursos</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                        {(["1m", "3m", "6m", "all"] as TopUsersRange[]).map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => setTopUsersRange(range)}
                                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${topUsersRange === range ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                            >
                                                {range === "1m" ? "1 mês" : range === "3m" ? "3 meses" : range === "6m" ? "6 meses" : "Todos"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {topUsers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {topUsers.map((user, index) => {
                                            const medals = ["🥇", "🥈", "🥉"];
                                            const barWidth = topUsers[0].total > 0 ? (user.total / topUsers[0].total) * 100 : 0;
                                            return (
                                                <div key={`${user.name}-${index}`} className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-300">
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
                                )}
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                </div>
            </div>

            {/* Export Button */}
            <AnimatedSection delay={500}>
                <div className="flex justify-center pt-2 pb-4">
                    <Button onClick={handleExportPDF} disabled={isExporting} variant="outline" size="lg" className="gap-3 px-8 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
                        {isExporting ? (
                            <><div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Gerando relatório...</>
                        ) : (
                            <><Download className="h-5 w-5 group-hover:animate-bounce" /> Gerar Relatório PDF</>
                        )}
                    </Button>
                </div>
            </AnimatedSection>
        </div>
    );
};

export default AdminDashboard;
