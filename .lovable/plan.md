

## Problema

O erro `ERR_BLOCKED_BY_CLIENT` no Microsoft Edge persiste mesmo com blob URLs porque o Edge bloqueia a renderização de PDFs dentro de `<iframe>` independentemente da origem. A solução é eliminar completamente o `<iframe>` e renderizar o PDF diretamente em elementos `<canvas>` usando a biblioteca `pdfjs-dist`.

## Solução

Usar `pdfjs-dist` para renderizar as páginas do PDF diretamente em canvas, com navegação entre páginas, zoom, e scroll — tudo dentro do Dialog existente.

### Mudanças

**1. Instalar `pdfjs-dist` (v3.11.174 para compatibilidade simples)**

**2. Criar `src/components/PdfViewer.tsx`**
- Componente que recebe uma URL, faz fetch como ArrayBuffer, e usa `pdfjs-dist` para renderizar cada página em `<canvas>`
- Renderiza todas as páginas em sequência (scroll vertical) para uma pré-visualização completa
- Inclui controle de zoom (+ / -)
- Loading spinner enquanto renderiza

**3. Atualizar `src/pages/Schedules.tsx`**
- Substituir o `<iframe>` pelo componente `PdfViewer`
- O estado `viewingPdf` passa a armazenar a URL original (não mais blob)
- O `PdfViewer` faz o fetch internamente
- Manter o botão "Abrir em nova aba" com abordagem blob para download

### Detalhes Técnicos

- `pdfjs-dist` v3.x usa worker via `pdfjs-dist/build/pdf.worker.entry`
- Cada página é renderizada em um `<canvas>` separado dentro de um container com scroll
- Scale padrão de 1.5 para boa legibilidade
- Fetch como `ArrayBuffer` → `pdfjsLib.getDocument({ data })` → renderiza em canvas
- Zero dependência do viewer nativo do navegador = funciona em qualquer browser

### Arquivos

| Arquivo | Ação |
|---|---|
| `package.json` | Adicionar `pdfjs-dist@3.11.174` |
| `src/components/PdfViewer.tsx` | Novo componente de renderização de PDF |
| `src/pages/Schedules.tsx` | Substituir iframe pelo PdfViewer |

