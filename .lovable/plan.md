

## Plano de Implementação

Este plano cobre 5 áreas: botão de excluir, cards de agendamento, calendário, upload de notificações e PWA.

---

### 1. Botão de Excluir Agendamento (Admin vs Normal)

**Problema:** Quando admin, o botão `size="icon"` com `h-8 w-8` tenta mostrar 2 ícones (Shield + Trash2) que estouram o espaço.

**Solução:** 
- Para admin excluindo agendamento de outro usuário: usar um botão mais largo (`w-auto px-2`) com os dois ícones menores lado a lado.
- Para o próprio usuário ou não-admin: manter botão `size="icon"` normal apenas com a lixeira.

Arquivo: `src/pages/Scheduling.tsx` (linhas 308-317)

---

### 2. Cards de Agendamento — Aba "Do Dia" e "Últimos"

**Aba "Do Dia":**
- A data exibida deve ser a data para qual foi agendado (já é assim).
- Adicionar botão "i" (Info) ao lado da data. Ao clicar, abre um `Popover` com detalhes: recurso, aula, período, quem agendou, data de criação e hora de criação (fuso America/Campo_Grande).

**Aba "Últimos":**
- Exibir a data para qual foi agendado como principal.
- Trocar "Agendado às HH:MM" por "Agendado em DD/MM/YYYY às HH:MM" (data e hora de criação).

Será necessário refatorar `renderBookingCard` para distinguir o contexto (day vs recent) e adicionar o popover de info na aba "Do Dia".

Arquivo: `src/pages/Scheduling.tsx`

---

### 3. Calendário — Diferenciar Dia Selecionado vs Dia Atual

**Problema:** `day_selected` e `day_today` usam estilos similares, causando confusão.

**Solução:** No `src/components/ui/calendar.tsx`:
- `day_today`: borda destacada sem preenchimento (ex: `border-2 border-primary text-primary font-bold`) — indica "hoje".
- `day_selected`: preenchimento sólido (já usa `bg-primary text-primary-foreground`) — indica seleção.

Isso garante que quando hoje e selecionado coincidem, o preenchimento prevalece, e quando são diferentes, são visualmente distintos.

Arquivo: `src/components/ui/calendar.tsx` (linha 36)

---

### 4. Upload de Imagens em Notificações

**Problema:** O bucket `notification-images` tem política de INSERT restrita a admins via `has_role(auth.uid(), 'admin')`. Essa função verifica a tabela `user_roles`. Se o administrador não tiver entrada nessa tabela, o upload falha silenciosamente.

**Investigação:** A política está correta. O problema provável é que falta uma política de **DELETE** no bucket para limpeza e, mais importante, o erro pode ser no `sanitizedName` que remove caracteres especiais mas pode gerar nomes duplicados em uploads rápidos (mesmo `Date.now()`). 

**Solução:**
- Adicionar `crypto.randomUUID()` ou timestamp mais granular ao nome do arquivo para evitar colisões.
- Adicionar política de DELETE para admins no bucket `notification-images`.
- Melhorar tratamento de erro no `handleSubmit` para mostrar a mensagem real do erro de upload ao invés de uma genérica.

Arquivos: `src/components/CreateNotificationDialog.tsx`, migração SQL

---

### 5. Visual PWA — theme-color e background_color

**Problema:** `manifest.json` tem `theme_color: "#4a7c59"` (verde) e `background_color: "#0f172a"`. O `index.html` tem `<meta name="theme-color" content="#4a7c59">`.

**Solução:**
- `public/manifest.json`: `background_color` → `"#272725"`, `theme_color` → `"#FAFAFA"`.
- `index.html`: remover o `<meta name="theme-color">` estático.
- `src/App.tsx`: no `useEffect` de tema, atualizar dinamicamente o `<meta name="theme-color">`:
  - Modo claro: `#FAFAFA`
  - Modo escuro: `#272725`

Arquivos: `public/manifest.json`, `index.html`, `src/App.tsx`

---

### Resumo de Arquivos a Editar

| Arquivo | Alteração |
|---|---|
| `src/pages/Scheduling.tsx` | Botão delete adaptativo + info popover + formato "Agendado em" |
| `src/components/ui/calendar.tsx` | Estilos distintos para today vs selected |
| `src/components/CreateNotificationDialog.tsx` | Melhor nomeação de arquivos + tratamento de erro detalhado |
| `public/manifest.json` | background_color → #272725, theme_color → #FAFAFA |
| `index.html` | Remover meta theme-color estático |
| `src/App.tsx` | Atualização dinâmica do theme-color meta tag |
| Migração SQL | Política de DELETE para notification-images |

