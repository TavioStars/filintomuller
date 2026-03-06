import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Wrench, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PRESET_COLORS = [
    { name: "Azul", value: "hsl(200, 70%, 50%)" },
    { name: "Laranja", value: "hsl(30, 85%, 55%)" },
    { name: "Verde-mar", value: "hsl(160, 60%, 45%)" },
    { name: "Rosa", value: "hsl(330, 70%, 60%)" },
    { name: "Amarelo", value: "hsl(45, 85%, 60%)" },
    { name: "Azul escuro", value: "hsl(220, 60%, 55%)" },
    { name: "Roxo", value: "hsl(280, 65%, 60%)" },
    { name: "Vermelho", value: "hsl(350, 65%, 55%)" },
    { name: "Verde", value: "hsl(120, 50%, 45%)" },
    { name: "Ciano", value: "hsl(180, 60%, 45%)" },
    { name: "Índigo", value: "hsl(240, 55%, 55%)" },
    { name: "Coral", value: "hsl(15, 75%, 55%)" },
];

interface Resource {
    id: string;
    name: string;
    emoji: string;
    color: string;
    status: "disponivel" | "manutencao";
    display_order: number;
}

const EMOJI_OPTIONS = ["📽️", "🖥️", "💻", "🔬", "🏢", "🔊", "📺", "🎤", "📱", "🖨️", "📡", "🔌"];

interface ResourcesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ResourcesSheet = ({ open, onOpenChange }: ResourcesSheetProps) => {
    const { toast } = useToast();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);

    const [editName, setEditName] = useState("");
    const [editEmoji, setEditEmoji] = useState("");
    const [editColor, setEditColor] = useState("");
    const [editCustomColor, setEditCustomColor] = useState("");
    const [editStatus, setEditStatus] = useState<"disponivel" | "manutencao">("disponivel");
    const [useCustomColor, setUseCustomColor] = useState(false);

    const [newName, setNewName] = useState("");
    const [newEmoji, setNewEmoji] = useState("📽️");
    const [newColor, setNewColor] = useState(PRESET_COLORS[0].value);
    const [newCustomColor, setNewCustomColor] = useState("#3b82f6");
    const [newUseCustom, setNewUseCustom] = useState(false);

    const fetchResources = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("resources")
            .select("*")
            .order("display_order", { ascending: true });
        if (!error && data) setResources(data as Resource[]);
        setLoading(false);
    };

    useEffect(() => {
        if (open) fetchResources();
    }, [open]);

    const openEditDialog = (resource: Resource) => {
        setEditingResource(resource);
        setEditName(resource.name);
        setEditEmoji(resource.emoji);
        setEditColor(resource.color);
        setEditStatus(resource.status);
        setUseCustomColor(!PRESET_COLORS.some((c) => c.value === resource.color));
        setEditCustomColor("#3b82f6");
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingResource || !editName.trim()) return;
        const finalColor = useCustomColor ? editCustomColor : editColor;
        const { error } = await supabase.from("resources").update({
            name: editName.trim(), emoji: editEmoji, color: finalColor, status: editStatus,
        }).eq("id", editingResource.id);
        if (error) {
            toast({ variant: "destructive", title: "Erro", description: error.message });
            return;
        }
        setEditDialogOpen(false);
        toast({ title: "Recurso atualizado! ✅", description: `${editName.trim()} foi atualizado com sucesso.` });
        fetchResources();
    };

    const handleAddResource = async () => {
        if (!newName.trim()) return;
        const finalColor = newUseCustom ? newCustomColor : newColor;
        const maxOrder = resources.length > 0 ? Math.max(...resources.map(r => r.display_order)) + 1 : 0;
        const { error } = await supabase.from("resources").insert({
            name: newName.trim(), emoji: newEmoji, color: finalColor, status: "disponivel" as const, display_order: maxOrder,
        });
        if (error) {
            toast({ variant: "destructive", title: "Erro", description: error.message });
            return;
        }
        setAddDialogOpen(false);
        setNewName(""); setNewEmoji("📽️"); setNewColor(PRESET_COLORS[0].value); setNewUseCustom(false);
        toast({ title: "Recurso adicionado! 🎉", description: `${newName.trim()} foi adicionado ao sistema.` });
        fetchResources();
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-primary" />
                            Gerenciar Recursos
                        </SheetTitle>
                        <SheetDescription>
                            Edite, adicione ou coloque recursos em manutenção. As alterações afetam o sistema de agendamento.
                        </SheetDescription>
                    </SheetHeader>

                    <Button onClick={() => setAddDialogOpen(true)} className="w-full mb-4 gap-2" variant="outline">
                        <Plus className="h-4 w-4" />
                        Adicionar Novo Recurso
                    </Button>

                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
                    ) : (
                        <div className="space-y-3">
                            {resources.map((resource) => (
                                <div
                                    key={resource.id}
                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${resource.status === "manutencao"
                                        ? "border-destructive/30 bg-destructive/5 opacity-75"
                                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                                    }`}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg"
                                        style={{ backgroundColor: resource.color + "22", borderLeft: `3px solid ${resource.color}` }}
                                    >
                                        {resource.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{resource.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {resource.status === "disponivel" ? (
                                                <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Disponível
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                                                    <Wrench className="h-3 w-3 mr-1" />
                                                    Manutenção
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => openEditDialog(resource)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center mt-6">
                        {resources.length} recurso{resources.length !== 1 ? "s" : ""} cadastrado{resources.length !== 1 ? "s" : ""}
                    </p>
                </SheetContent>
            </Sheet>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Editar Recurso</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome do Recurso</Label>
                            <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ex: Datashow 4" />
                        </div>
                        <div className="space-y-2">
                            <Label>Ícone</Label>
                            <div className="flex flex-wrap gap-2">
                                {EMOJI_OPTIONS.map((emoji) => (
                                    <button key={emoji} onClick={() => setEditEmoji(emoji)}
                                        className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border-2 transition-all ${editEmoji === emoji ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/30"}`}>
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Cor</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Personalizada</span>
                                    <Switch checked={useCustomColor} onCheckedChange={setUseCustomColor} />
                                </div>
                            </div>
                            {useCustomColor ? (
                                <div className="flex items-center gap-3">
                                    <input type="color" value={editCustomColor} onChange={(e) => setEditCustomColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-border" />
                                    <Input value={editCustomColor} onChange={(e) => setEditCustomColor(e.target.value)} placeholder="#hex" className="flex-1" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-6 gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button key={color.value} onClick={() => setEditColor(color.value)}
                                            className={`w-full aspect-square rounded-lg border-2 transition-all ${editColor === color.value ? "border-foreground scale-110 ring-2 ring-primary/30" : "border-transparent hover:border-border"}`}
                                            style={{ backgroundColor: color.value }} title={color.name} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <div className="flex gap-2">
                                <Button variant={editStatus === "disponivel" ? "default" : "outline"} size="sm" onClick={() => setEditStatus("disponivel")} className="flex-1 gap-1">
                                    <Check className="h-3.5 w-3.5" /> Disponível
                                </Button>
                                <Button variant={editStatus === "manutencao" ? "destructive" : "outline"} size="sm" onClick={() => setEditStatus("manutencao")} className="flex-1 gap-1">
                                    <Wrench className="h-3.5 w-3.5" /> Manutenção
                                </Button>
                            </div>
                            {editStatus === "manutencao" && (
                                <p className="text-xs text-destructive">⚠️ O recurso ficará indisponível para novos agendamentos.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveEdit} disabled={!editName.trim()}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Adicionar Novo Recurso</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="new-name">Nome do Recurso</Label>
                            <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Projetor Portátil" />
                        </div>
                        <div className="space-y-2">
                            <Label>Ícone</Label>
                            <div className="flex flex-wrap gap-2">
                                {EMOJI_OPTIONS.map((emoji) => (
                                    <button key={emoji} onClick={() => setNewEmoji(emoji)}
                                        className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border-2 transition-all ${newEmoji === emoji ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/30"}`}>
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Cor</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Personalizada</span>
                                    <Switch checked={newUseCustom} onCheckedChange={setNewUseCustom} />
                                </div>
                            </div>
                            {newUseCustom ? (
                                <div className="flex items-center gap-3">
                                    <input type="color" value={newCustomColor} onChange={(e) => setNewCustomColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer border border-border" />
                                    <Input value={newCustomColor} onChange={(e) => setNewCustomColor(e.target.value)} placeholder="#hex" className="flex-1" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-6 gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button key={color.value} onClick={() => setNewColor(color.value)}
                                            className={`w-full aspect-square rounded-lg border-2 transition-all ${newColor === color.value ? "border-foreground scale-110 ring-2 ring-primary/30" : "border-transparent hover:border-border"}`}
                                            style={{ backgroundColor: color.value }} title={color.name} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddResource} disabled={!newName.trim()}>Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ResourcesSheet;
