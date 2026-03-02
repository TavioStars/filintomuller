

## Correções

### 1. Upload — Erro "Invalid key" (`src/pages/Schedules.tsx`)
Adicionar função `sanitizeFileName` que remove acentos, espaços e caracteres especiais do nome do arquivo antes do upload.

### 2. PdfViewer — Zoom e scroll (`src/components/PdfViewer.tsx`)
- Remover `canvas.style.maxWidth = "100%"` e `canvas.style.height = "auto"` — são eles que anulam o zoom
- Envolver os canvas num wrapper com `min-width: fit-content` para permitir scroll horizontal quando zoom > 100%
- Adicionar botão de reset zoom (100%)
- Scale inicial = 1.0 para caber melhor no celular
- Container com `touch-action: pan-x pan-y` para navegação por toque

| Arquivo | Mudança |
|---|---|
| `src/pages/Schedules.tsx` | Sanitizar nome do arquivo no upload |
| `src/components/PdfViewer.tsx` | Corrigir zoom real + scroll horizontal + reset + mobile touch |

