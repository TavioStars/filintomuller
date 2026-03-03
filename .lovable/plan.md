

## Plano de Atualizações

Este é um conjunto grande de mudanças. Vou dividir em **4 blocos** para implementação organizada.

---

### Bloco 1 — Recursos de Agendamento

**Mudanças nos recursos (`Scheduling.tsx` + `index.css` + `tailwind.config.ts`):**

| Atual | Novo |
|---|---|
| Sala de Informática | STE 2 |
| (novo) | Datashow 3 |
| (novo) | Notebook |
| (novo) | Caixa de Som |

Aulas renomeadas para "1ª Aula", "2ª Aula", etc.

**RESOURCES** passará de 5 para **8 recursos**. Cores do calendário serão recalculadas:
- Total de slots: 6 aulas × 8 recursos = **48**
- Verde: até 10 agendamentos
- Amarelo: 11-24
- Vermelho: 25-48

Novas variáveis CSS para as 3 cores dos novos recursos.

---

### Bloco 2 — Sistema de Notificações In-App

**Nova tabela `in_app_notifications`:**
```sql
CREATE TABLE in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'new_notification', 'booking_deleted'
  title text NOT NULL,
  body text NOT NULL,
  data jsonb, -- { notification_id, booking_id, admin_name, etc. }
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```
Com RLS: usuários só leem as próprias notificações.

**Quando uma notificação é criada por admin** → trigger/function insere uma `in_app_notification` para todos os usuários com tipo `new_notification`, contendo título, preview do conteúdo e banner.

**Quando um admin apaga um agendamento de outro usuário** → o código em `handleDeleteBooking` cria uma `in_app_notification` para o dono do agendamento, com o nome do admin que apagou.

**UI:** Ícone de sino no header/navigation com badge de contagem de não lidas. Ao clicar, abre lista de notificações in-app. Clicar em uma notificação do tipo `new_notification` navega para `/notifications`.

---

### Bloco 3 — Notificações do Navegador (Push via Browser API)

**Settings.tsx** — Nova card com toggle de notificações:
- Desativado: ícone de sino cinza riscado (`BellOff`)
- Ativado: ícone de sino verde (`Bell`)
- Ao ativar: chama `Notification.requestPermission()`
- Estado salvo em `localStorage` + coluna `push_enabled` na tabela `profiles`

**Notifications.tsx** — Popup ao entrar:
- Se `push_enabled` é `false`, mostra dialog perguntando se quer ativar
- Se já ativado, não mostra nada

**Envio de notificação browser:**
- Quando uma `in_app_notification` é criada, se o usuário está com a aba aberta e tem permissão, dispara `new Notification(title, { body, icon })` via realtime subscription

---

### Bloco 4 — Redesign da Aba de Agendamentos (inspirado na imagem)

**Layout principal** (desktop: 2 colunas, mobile: stack):

```text
┌─────────────────────────────────────────────────────┐
│  Header: ícone + "Agendamento"   [Mat][Vesp][Not]   │
├──────────────────┬──────────────────────────────────┤
│   CALENDÁRIO     │  Tabs: [Do Dia] [Últimos]       │
│   ┌──────────┐   │  Filtro: [Todos][STE 2][DS1]... │
│   │ março    │   │  ─────────────────────────────── │
│   │ 1 2 3... │   │  03/03/2026  2 agend.           │
│   │          │   │  ┌─────────────────────────┐    │
│   └──────────┘   │  │ STE 2  •  2ª Aula       │    │
│                  │  │ 👤 Professor — Nome      │    │
│   DATA SELECION. │  └─────────────────────────┘    │
│   03/03/2026     │                                  │
│   2 agendamentos │  (scroll vertical)               │
│                  │                                  │
│   [+ Novo agend.]│                                  │
│                  │                                  │
│   RECURSOS       │                                  │
│   ● STE 2       │                                  │
│   ● Laboratório  │                                  │
│   ● ...          │                                  │
├──────────────────┴──────────────────────────────────┤
│  Total: X   STE 2: Y   Lab: Z   ...                │
└─────────────────────────────────────────────────────┘
```

**Mudanças de comportamento:**
- **1º clique no dia**: seleciona o dia e mostra agendamentos na aba "Do Dia" (sem dialog)
- **2º clique no mesmo dia**: abre dialog com opções "Agendar" e "Ver detalhes"
- **Aba "Do Dia"**: mostra agendamentos do dia selecionado, filtráveis por recurso. Se vazio: "Não há agendamentos para este dia"
- **Aba "Últimos"**: mantém o comportamento atual de agendamentos recentes, também com filtro por recurso
- **Barra de filtro horizontal** com scroll: botões para cada recurso + "Todos"
- **Legenda de recursos** abaixo do calendário com cores
- **Rodapé** com contagem por recurso

Remoção do dialog intermediário no 1º clique (fica inline na aba "Do Dia").

---

### Arquivos Afetados

| Arquivo | Mudanças |
|---|---|
| `src/pages/Scheduling.tsx` | Recursos, aulas, redesign completo com abas Do Dia/Últimos, filtro por recurso, click duplo |
| `src/index.css` | Novas variáveis CSS para Datashow 3, Notebook, Caixa de Som |
| `tailwind.config.ts` | Novas cores para os 3 recursos |
| `src/pages/Settings.tsx` | Toggle de notificações browser |
| `src/pages/Notifications.tsx` | Popup para ativar notificações |
| `src/components/Navigation.tsx` | Badge de notificações in-app no sino |
| **Novo** `src/hooks/useInAppNotifications.tsx` | Hook para notificações in-app com realtime |
| **Novo** `src/components/NotificationsBell.tsx` | Componente do sino com badge e dropdown |
| **Migração SQL** | Tabela `in_app_notifications`, triggers, coluna `push_enabled` em profiles, RLS |

### Ordem de implementação sugerida

1. Bloco 1 (recursos + aulas) — mudança de dados simples
2. Bloco 4 (redesign agendamentos) — depende do Bloco 1
3. Bloco 2 (notificações in-app) — migração DB + lógica
4. Bloco 3 (notificações browser) — depende do Bloco 2

