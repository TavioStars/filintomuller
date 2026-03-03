

## Plano de Atualizações — Revisão da Plataforma

---

### 1. Perfil do Usuário (Settings + Storage)

**Migração SQL:**
- Adicionar coluna `avatar_url` (text, nullable) na tabela `profiles`
- Criar bucket de storage `avatars` (público) com políticas RLS para upload/delete pelo próprio usuário

**Settings.tsx** — Nova seção "Perfil" no topo:
- Avatar redondo com foto ou ícone padrão (User icon)
- Botão para upload de foto → abre file input → após selecionar, exibe cropper 1:1 (usando canvas nativo para corte, sem lib externa) → salva no bucket `avatars` → atualiza `profiles.avatar_url`
- Exibe nome e cargo do usuário como campos somente leitura (texto, não inputs)

**RLS do profiles:** A coluna `avatar_url` pode ser atualizada pelo próprio usuário (já permitido pela política atual de UPDATE, desde que role/status não mudem).

---

### 2. Admin — Edição de Usuário com Foto, Nome e Cargo

**UsersSheet.tsx:**
- No dialog de editar usuário, exibir avatar (ou ícone padrão) no topo
- Campo "Nome" passa a ser **editável** (Input não disabled)
- Adicionar estado `editedName` e incluir no `handleSaveChanges`
- `handleSaveChanges` usa a RPC `update_account_status` para role/status, mas para nome e role precisa de um novo approach: criar uma função RPC `admin_update_profile` que permite admins alterarem `name` e `role` de qualquer usuário (pois a RLS impede que outro usuário atualize esses campos)

**Nova função SQL `admin_update_profile`:**
```sql
CREATE FUNCTION public.admin_update_profile(
  target_user_id uuid, new_name text, new_role text
) RETURNS void SECURITY DEFINER ...
-- Verifica has_role(auth.uid(), 'admin'), depois UPDATE profiles SET name, role
```

---

### 3. Fix — ScrollArea de Select (Categorias/Cargos)

O bug de arrastar nas listas de Select (`SelectContent`) é um problema conhecido do Radix Select em mobile. A correção é adicionar `position="popper"` e `sideOffset` no `SelectContent` dos componentes Auth.tsx e UsersSheet.tsx para melhorar o comportamento de scroll.

Alternativa mais robusta: usar `Popover` + lista customizada ao invés de `Select` nos pontos problemáticos. Porém a correção mais simples é adicionar a prop `position="popper"` no `SelectContent`.

---

### 4. Revisão — Alunos: Visualizar Sem Agir

**Scheduling.tsx** — Atualmente alunos recebem toast de "Acesso restrito" ao clicar em um dia. Corrigir para:
- Alunos **podem** clicar e ver agendamentos do dia (aba "Do Dia")
- Alunos **não podem** agendar (botão "Novo agendamento" oculto, 2º clique não abre dialog)
- Remover o toast de bloqueio no `handleDayClick` para alunos — eles devem poder navegar e visualizar

---

### 5. Badge BETA — Materiais Didáticos

**Menu.tsx** — No card de "Materiais Didáticos", adicionar um `<Badge>` com texto "BETA" ao lado do título, com estilo sutil (ex: `variant="secondary"` com texto pequeno).

---

### 6. Rodapé de Agendamentos — Total do Mês + Individuais do Dia

**Scheduling.tsx:**
- **"Total"** → passa a mostrar total de agendamentos **do mês atual** (filtrar por `selectedDate.getMonth()` e `selectedDate.getFullYear()`)
- **Contagens por recurso** → mostram total **apenas do dia selecionado** (não de todo o período)
- Labels atualizados: "Total do mês: X" e cada recurso "Recurso: Y (hoje)"

---

### 7. Horário de Agendamento na Aba "Últimos"

**Scheduling.tsx — `renderBookingCard`:**
- Na aba "Últimos", exibir o horário em que o booking foi criado (`created_at`), convertido para o fuso de MS (America/Campo_Grande, UTC-4)
- Usar `toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande', hour: '2-digit', minute: '2-digit' })` no `created_at`
- Exibir como "Agendado às HH:MM" abaixo da data

---

### Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| **Migração SQL** | `avatar_url` em profiles, bucket `avatars`, função `admin_update_profile` |
| `src/pages/Settings.tsx` | Seção de perfil com avatar, cropper, nome/cargo readonly |
| `src/components/UsersSheet.tsx` | Avatar no dialog, nome editável, salvar via RPC |
| `src/pages/Auth.tsx` | `position="popper"` no SelectContent |
| `src/pages/Scheduling.tsx` | Alunos podem visualizar; rodapé com total do mês + dia; horário no card |
| `src/pages/Menu.tsx` | Badge BETA em Materiais Didáticos |

### Ordem de implementação

1. Migração SQL (avatar_url, bucket, admin_update_profile)
2. Perfil na Settings + Cropper
3. Admin edição de nome/cargo no UsersSheet
4. Fix Select scroll
5. Revisão alunos
6. Badge BETA
7. Rodapé + horário de agendamento

