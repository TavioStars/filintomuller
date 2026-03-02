

## Problema

O Microsoft Edge (e outros navegadores) bloqueia a exibição de PDFs dentro de `<iframe>` quando o PDF vem de um domínio diferente (cross-origin) - neste caso, o storage do Lovable Cloud. A mensagem "Esta página foi bloqueada pelo Microsoft Edge" confirma isso.

## Solução

Substituir o `<iframe>` direto por uma abordagem que **baixa o PDF como blob** e cria uma URL local (`blob:`) para exibição. Isso contorna o bloqueio cross-origin. Também corrigir o botão "Abrir em nova aba" para usar a mesma abordagem de blob.

### Mudanças em `src/pages/Schedules.tsx`

1. **Adicionar função `fetchPdfAsBlob`** que faz `fetch()` na URL do PDF, converte para blob, e retorna um `URL.createObjectURL(blob)`.

2. **Alterar o botão "Visualizar"** para chamar `fetchPdfAsBlob`, armazenar a blob URL no state, e usar essa URL no iframe do Dialog.

3. **Alterar o botão "Abrir em nova aba"** para também usar blob: abrir o PDF via `window.open()` com a blob URL em vez de link direto.

4. **Limpar blob URLs** ao fechar o dialog (`URL.revokeObjectURL`).

5. **Adicionar estado de loading** enquanto o PDF é baixado, com feedback visual.

### Detalhes Técnicos

- `fetch(url)` → `response.blob()` → `URL.createObjectURL(blob)` gera uma URL `blob:` local que o navegador não bloqueia
- Revogar a URL ao fechar o dialog para liberar memória
- Tratar erros de download com toast informativo

### Arquivo Modificado

| Arquivo | Ação |
|---|---|
| `src/pages/Schedules.tsx` | Implementar fetch blob para visualização e abertura de PDFs |

