

## Plano de Implementação: Sistema de Horários com PDFs

### Resumo

Transformar a página de Horários de estática (imagem hardcoded) para dinâmica, com PDFs armazenados no banco de dados e storage, organizados por período (Matutino/Vespertino/Noturno) e nível (Ensino Médio/Fundamental). Administradores podem fazer upload e excluir PDFs. Todos os usuários autenticados podem visualizar. Funções de admin marcadas com ícone de escudo.

### Mudanças no Banco de Dados

**Nova tabela `schedules`:**
```sql
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL CHECK (period IN ('matutino', 'vespertino', 'noturno')),
  level text NOT NULL CHECK (level IN ('medio', 'fundamental')),
  file_url text NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period, level)  -- Only one schedule per period+level
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "Anyone can view schedules" ON public.schedules
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert schedules" ON public.schedules
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete schedules" ON public.schedules
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update schedules" ON public.schedules
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));
```

**Novo bucket de storage `schedule-files`:**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('schedule-files', 'schedule-files', true);

CREATE POLICY "Anyone can view schedule files" ON storage.objects
  FOR SELECT USING (bucket_id = 'schedule-files');

CREATE POLICY "Admins can upload schedule files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'schedule-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schedule files" ON storage.objects
  FOR DELETE USING (bucket_id = 'schedule-files' AND public.has_role(auth.uid(), 'admin'));
```

### Mudanças no Frontend

#### 1. Reescrever `src/pages/Schedules.tsx`

Substituir completamente a página atual (que usa imagem estática) por:

- **3 abas de período**: Matutino, Vespertino, Noturno
- **Dentro de cada aba**: 2 cards - "Ensino Médio" e "Ensino Fundamental"
- **Cada card mostra**:
  - Se existe PDF: botão para visualizar o PDF (abre em iframe/embed dentro de dialog) + botão de excluir (apenas admin, com ícone de escudo)
  - Se não existe: mensagem "Não há horário definido disponível" + botão de upload (apenas admin, com ícone de escudo)
- **Upload**: Dialog com input de arquivo (apenas PDF), faz upload para bucket `schedule-files`, insere registro na tabela `schedules`
- **Exclusão**: Confirma com dialog, remove do storage e da tabela
- **Visualização**: Embed do PDF dentro de um Dialog fullscreen, ou link para abrir em nova aba

#### 2. Ícone de escudo em funções de admin

Em todos os lugares onde há botões/ações exclusivas de administradores, adicionar o ícone `Shield` ao lado do ícone original da função. Isso se aplica a:

- Botões de upload/excluir horários na nova página de Schedules
- Botão de excluir agendamentos de outros usuários em Scheduling.tsx (o `Trash2` ganha um `Shield` ao lado)
- `AddMaterialDialog` e botões de excluir materiais
- `CreateCategoryDialog` e `CreateNotificationDialog`
- Qualquer outro botão admin-only encontrado

### Arquivos Modificados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/...` | Nova migration para tabela `schedules` + bucket + RLS |
| `src/pages/Schedules.tsx` | Reescrita completa |
| `src/pages/Scheduling.tsx` | Adicionar shield nos botões admin |
| `src/components/AddMaterialDialog.tsx` | Adicionar shield no trigger button |
| `src/components/CreateCategoryDialog.tsx` | Adicionar shield |
| `src/components/CreateNotificationDialog.tsx` | Adicionar shield |

### Detalhes Técnicos

- A constraint `UNIQUE (period, level)` garante apenas um horário por combinação período+nível (6 combinações no total)
- Upload aceita apenas PDF (type="application/pdf")
- Visualização do PDF usa `<iframe>` com a URL pública do storage
- O arquivo estático `horario-ensino-medio.jpg` pode ser removido depois, mas não é bloqueante
- PDFs públicos no bucket permitem visualização direta sem autenticação no storage

