

## Problemas Identificados

### 1. Bug visual no upload — ambos os cards mostram "Enviando..."
O estado `uploading` é um único `boolean` compartilhado entre todos os cards. Quando um upload começa, todos os botões ficam desabilitados e mostram "Enviando...".

**Correção**: Trocar `uploading: boolean` por `uploading: string | null` que guarda o identificador do upload ativo (ex: `"matutino-medio"`). Cada card só mostra "Enviando..." se o `uploading` corresponder ao seu `period-level`.

### 2. PDF Viewer — qualidade ruim e scroll não funciona

**Problemas atuais**:
- Scale 1.0 gera canvas com resolução baixa — qualidade ruim em telas de alta densidade (celular)
- O container com `flex-1` dentro do Dialog não tem altura fixa calculada, então o overflow não funciona corretamente
- `min-width: fit-content` no wrapper não é suficiente para garantir scroll horizontal

**Correção no `PdfViewer.tsx`**:
- Usar `window.devicePixelRatio` para renderizar o canvas em resolução nativa (2x ou 3x) mas exibir no tamanho lógico via CSS — isso melhora a qualidade drasticamente
- Dar ao container uma altura explícita (`height: 100%` com `overflow: auto`) e `position: relative`
- Garantir que o wrapper interno tenha `display: inline-block` + `min-width: 100%` para que o scroll horizontal funcione quando o conteúdo ultrapassa
- Manter `touch-action: pan-x pan-y` para mobile
- O zoom altera o scale lógico, e o container permite scroll em ambas as direções

## Mudanças

| Arquivo | Mudança |
|---|---|
| `src/pages/Schedules.tsx` | Trocar `uploading: boolean` por `uploading: string \| null` para isolar o estado de upload por card |
| `src/components/PdfViewer.tsx` | Usar devicePixelRatio para qualidade HD; corrigir container para scroll funcional em ambas as direções |

### Detalhes técnicos do PdfViewer

```text
┌─────────────────────────────────┐
│ Controles de zoom (fixo no topo)│
├─────────────────────────────────┤
│ containerRef (overflow: auto)   │
│ ┌─────────────────────────────┐ │
│ │ wrapperRef (inline-block)   │ │
│ │ ┌───────────────────────┐   │ │
│ │ │ canvas 1 (HD via dpr) │   │ │
│ │ ├───────────────────────┤   │ │
│ │ │ canvas 2              │   │ │
│ │ └───────────────────────┘   │ │
│ └─────────────────────────────┘ │
│  ← scroll horizontal →         │
│  ↕ scroll vertical              │
└─────────────────────────────────┘
```

Canvas rendering com devicePixelRatio:
- `canvas.width = viewport.width * dpr` (resolução real)
- `canvas.height = viewport.height * dpr`
- `canvas.style.width = viewport.width + "px"` (tamanho visual)
- `ctx.scale(dpr, dpr)` antes do render

