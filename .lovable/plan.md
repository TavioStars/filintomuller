

## Navegação Mobile — Bolhas com Animação

### O que muda

No mobile, a barra de navegação inferior será redesenhada para exibir dois ícones circulares (Menu e Agendamento) dentro de uma "pílula" arredondada centralizada, com um indicador animado que desliza entre os dois ao trocar de aba. O NotificationsBell será mantido separado, posicionado acima ou ao lado da pílula. No desktop, tudo permanece como está.

### Design Mobile

```text
┌──────────────────────────────┐
│                              │
│     ┌─────────────────┐      │
│     │  (●)       (○)  │  🔔  │
│     │  Menu    Agenda │      │
│     └─────────────────┘      │
└──────────────────────────────┘

O círculo preenchido (●) indica a aba ativa.
Um "pill" de fundo desliza com transition entre as posições.
```

### Implementação — `Navigation.tsx`

- Detectar mobile via `useIsMobile()`
- **Mobile**: renderizar uma pílula (`rounded-full bg-card`) centralizada com dois botões circulares lado a lado
  - Cada botão: `w-14 h-14 rounded-full` com ícone centralizado
  - Um `div` absoluto com `rounded-full bg-gradient-primary` atrás do botão ativo, posicionado com `translate-x` animado via `transition-transform duration-300`
  - O ícone ativo fica branco; o inativo fica `text-muted-foreground`
  - Sem labels de texto no mobile (só ícones)
  - NotificationsBell posicionado à direita da pílula
- **Desktop**: manter o layout atual sem alterações

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/components/Navigation.tsx` | Layout condicional mobile vs desktop com animação de slide |

