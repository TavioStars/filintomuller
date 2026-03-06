

## Plano de Implementação — Integração Completa

Este plano aborda: build error, dashboard com dados reais, tabela de recursos, push notifications, calendário e PWA.

---

### 1. Corrigir Build Error — Edge Function Push

**Problema:** `npm:web-push@3.6.7` não é resolvido no Deno. Precisa de importação via `esm.sh`.

**Solução:** Em `supabase/functions/push/index.ts`, trocar:
```
import webpush from "npm:web-push@3.6.7";
```
por:
```
import webpush from "https://esm.sh/web-push@3.6.7";
```

---

### 2. Dashboard — Substituir Mocks por Dados Reais

**Arquivo:** `src/components/AdminDashboard.tsx`

Remover todas as constantes `MOCK_*` e substituir por queries ao Supabase na tabela `bookings`:

- **Summary cards:** Queries filtradas por período:
  - `bookingsCreatedToday`: bookings com `created_at` de hoje
  - `bookingsForToday`: bookings com `date` de hoje
  - `bookingsThisWeek`: bookings com `date` na semana corrente (seg-sex)
  - `topResource`: recurso com mais bookings no mês atual

- **Weekly chart (Picos Semanais):** Contar bookings por dia da semana na semana atual

- **Resource distribution:** Contar bookings por recurso no mês atual

- **Heatmap:** Calcular % de ocupação por aula × período nos últimos 2m/6m/1a. Fórmula: `(contagem / (dias_úteis × total_recursos)) × 100`

- **Top Users:** Query agrupada por `user_id` com JOIN em `profiles`, ordenada por contagem descendente, LIMIT 5

Todas as queries filtram por `period` quando não é "todos". Usar `useEffect` com dependências `[period, heatmapRange]`.

---

### 3. Tabela `resources` — Criar e Conectar

**Migração SQL:**
```sql
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '📽️',
  color text NOT NULL DEFAULT 'hsl(200, 70%, 50%)',
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'manutencao')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Todos podem ver
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
-- Admins gerenciam
CREATE POLICY "Admins can insert resources" ON public.resources FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update resources" ON public.resources FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete resources" ON public.resources FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Seed com recursos existentes
INSERT INTO public.resources (name, emoji, color, status, display_order) VALUES
  ('Sala de Reunião', '🏢', 'hsl(280, 65%, 60%)', 'disponivel', 0),
  ('Datashow 1', '📽️', 'hsl(200, 70%, 50%)', 'disponivel', 1),
  ('Datashow 2', '📽️', 'hsl(30, 85%, 55%)', 'disponivel', 2),
  ('Datashow 3', '📽️', 'hsl(160, 60%, 45%)', 'disponivel', 3),
  ('STE 2', '🖥️', 'hsl(330, 70%, 60%)', 'disponivel', 4),
  ('Laboratório', '🔬', 'hsl(45, 85%, 60%)', 'disponivel', 5),
  ('Notebook', '💻', 'hsl(220, 60%, 55%)', 'disponivel', 6),
  ('Caixa de Som', '🔊', 'hsl(350, 65%, 55%)', 'disponivel', 7);
```

**ResourcesSheet.tsx:** Substituir `useState(INITIAL_RESOURCES)` por fetch/upsert/insert/delete no Supabase. Recarregar lista após cada operação.

**Scheduling.tsx:** Buscar recursos disponíveis (`status = 'disponivel'`) do banco ao invés do array hardcoded `RESOURCES`. Filtrar recursos em manutenção no diálogo de seleção.

---

### 4. Push Notifications — Corrigir Envio Sem Imagem + Imagem Expandível

**Problema 1:** Notificações sem imagem não enviam push. O `sendPushToAll` é chamado com `title` e `body`, mas a edge function pode falhar silenciosamente.

**Causa provável:** A edge function funciona, mas o `sendPushToAll` em `CreateNotificationDialog.tsx` não passa o `data` (notification_id, banner_image). Precisa passar para que o SW monte a notificação corretamente.

**Solução:** Em `CreateNotificationDialog.tsx`, passar `data` com `notification_id` e `banner_image`:
```ts
await sendPushToAll(result.data.title, notifPreview, {
  notification_id: insertedId, // pegar o id retornado do insert
  banner_image: bannerUrl
});
```
Alterar o insert para retornar `.select('id').single()` e capturar o ID.

**Problema 2:** Imagem expandível na notificação push.

**Solução:** No `public/sw.js`, adicionar `image` às opções da notificação quando disponível:
```js
const options = {
  body: data.body || '',
  icon: '/icon-192.png',
  badge: '/notification-badge.png',
  image: data.data?.banner_image || undefined, // imagem grande expandível
  data: data.data || {},
  vibrate: [200, 100, 200],
};
```

---

### 5. Calendário — Cores e Bordas

**Arquivo:** `src/pages/Scheduling.tsx`

**Thresholds:** Alterar `getDateBookingStatus`:
- ≤6 → `"low"` (verde)
- 7-20 → `"medium"` (amarelo)  
- >20 → `"high"` (vermelho)

**Hoje com cor de agendamento:** O problema é que `day_today` sobrescreve os modifier classes. Solução: no calendário, aplicar as cores dos modifiers com `!important` via CSS customizado ou usar classNames que combinem. Na prática, ajustar `modifiersClassNames` para que incluam o contorno quando é hoje, e no `calendar.tsx` garantir que `day_today` não sobreponha o fundo dos modifiers.

Abordagem: remover o `bg-transparent` de `day_today` no calendar.tsx, e adicionar nos `modifiersClassNames` do Scheduling uma classe especial. Melhor: usar CSS customizado no `index.css`:
```css
/* Hoje mantém borda + cor de booking */
.rdp-day_today.day-low { @apply bg-primary/20 border-2 border-primary; }
.rdp-day_today.day-medium { @apply bg-laboratory/20 border-2 border-primary; }
.rdp-day_today.day-high { @apply bg-destructive/20 border-2 border-primary; }
```

**Bordas arredondadas no selecionado:** No `calendar.tsx`, a cell class tem `rounded-l-md` / `rounded-r-md`. Para dia selecionado individual, garantir `rounded-md` no `day_selected`. Ajustar a cell class para usar `[&:has([aria-selected])]:rounded-md` ao invés de left/right separados.

---

### 6. PWA — Cores

**manifest.json:** `background_color` → `"#272725"`, `theme_color` → `"#FAFAFA"`

**index.html:** Atualizar os meta tags de theme-color:
- light: `#FAFAFA`
- dark: `#272725`

**App.tsx:** Manter o `MutationObserver` dinâmico já implementado (se presente), garantindo os valores corretos.

---

### Resumo de Arquivos

| Arquivo | Alteração |
|---|---|
| `supabase/functions/push/index.ts` | Fix import web-push |
| `src/components/AdminDashboard.tsx` | Reescrever com queries reais ao Supabase |
| Migração SQL | Criar tabela `resources` com seed |
| `src/components/ResourcesSheet.tsx` | CRUD conectado ao banco |
| `src/pages/Scheduling.tsx` | Buscar recursos do banco + novos thresholds calendário |
| `src/components/CreateNotificationDialog.tsx` | Passar data com ID ao push |
| `public/sw.js` | Adicionar `image` na notificação expandível |
| `src/components/ui/calendar.tsx` | Ajustar bordas arredondadas e classes today |
| `src/index.css` | CSS para hoje + cores de booking |
| `public/manifest.json` | background_color + theme_color |
| `index.html` | Atualizar meta theme-color |

