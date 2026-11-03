# Anime Powers — Catálogo e Simulador de Batalhas

Tema: **Poderes de Anime** (Ninjutsu, Akuma no Mi, Nen, Ki, Feitiços, Respiração, Stand, Reiatsu).

## 1. Visão Geral
**Objetivo:** catalogar habilidades de animes e permitir simulação lúdica de duelos, montagem de grimório/deck e descoberta de afinidade elemental.

**Problema resolvido:** informações sobre poderes ficam dispersas em wikis/fóruns, sem comparação padronizada (dano, alcance, custo, elemento). O app centraliza 54+ poderes com atributos uniformes e interações práticas.

**Público-alvo:** fãs de anime, estudantes de desenvolvimento web e avaliadores acadêmicos.

## 2. Tech Stack
- Linguagens: JavaScript (ES2022), HTML5, CSS3
- Framework: React 19 + Vite 8
- Roteamento: `react-router-dom` com `HashRouter` (compatível com GitHub Pages)
- Estilo: CSS3 puro com custom properties, dividido em camadas por responsabilidade
  (`globals` → tokens/reset/tipografia, `components`, `layout`, uma folha por tela)
- Tipografia: **Anton** (display, caixa alta) + **Inter** (interface), auto-hospedadas em
  `public/fonts/` (woff2, subsets latin + latin-ext, 192 KB) — sem dependência de CDN
- Persistência: LocalStorage (`pa:favoritos`, `pa:deck`, `pa:duelos`, `pa:afinidade`, sessão de conta)
- Dados: Mock JSON em `src/data/powers.json` (54 poderes)
- Ícones: SVG em traço próprios (`components/Icons.jsx`) — nenhuma biblioteca de ícones
- Deploy: GitHub Actions (build estático em `dist/`)
- Ferramentas: Node 20+, npm, oxlint, Vitest

## 3. Recursos e Funcionalidades (efetivamente implementado)
- [x] Catálogo com busca em tempo real (nome/personagem/anime/categoria) + debounce 200ms
- [x] Filtros combináveis: categoria, obra, elemento, faixa de dano, faixa de custo e ordem
      (A–Z, maior dano, menor custo, custo-benefício, adicionados recentemente)
- [x] **Filtros gravados na URL** (`#/catalogo?elemento=Fogo&q=naruto`): link compartilhável e
      botão voltar do navegador preserva a consulta
- [x] Página de detalhe por técnica em `/poder/:id` (deep-link), com ficha, leitura comparativa
      dos atributos, favoritos, grimório, atalho para o duelo e navegação anterior/próxima
- [x] Favoritos com LocalStorage + filtro “somente favoritos” + contador
- [x] Simulador de Duelo: 2 poderes, fórmula `dano×0.7 + (100−custo)×0.3 + rand(0–10)`,
      multiplicador elemental, bônus de afinidade, histórico persistente (20 últimos)
- [x] Narração e análise pré-duelo via Gemini (exigem `VITE_GEMINI_API_KEY`; sem a chave a
      tela explica a falha e o resto do simulador segue funcionando)
- [x] Grimório/Compêndio: até 6 técnicas, validação anti-duplicata e limite, export/import JSON,
      totais de dano e custo em tempo real
- [x] Teste de Afinidade: quiz de 5 perguntas → elemento, resultado persistido e aplicado no duelo
- [x] Conta local (e-mail/senha + Google Identity Services) com sessão no navegador
- [x] Responsivo mobile/tablet/desktop, estados vazios, `prefers-reduced-motion`, contraste AA
- [x] PWA instalável com service worker (cache de app shell, fontes e imagens)
- [ ] Não incluído (proposital): backend, recuperação de senha, sincronização entre dispositivos

## 4. Requisitos Funcionais e Não-Funcionais
**RF1 — Catálogo interativo:** listagem, filtro por categoria, busca em tempo real → `src/components/PowerCatalog.jsx` + `SearchBar.jsx` + `FilterBar.jsx` + `powers.json`.
**RF2 — Detalhes da habilidade:** página `/poder/:id` com dano, alcance, elemento, custo, descrição, personagem e obra → `src/pages/Poder.jsx`.
**RF3 — Módulo interativo:** Grimório + Duelo + Afinidade → `DeckBuilder.jsx`, `DuelSimulator.jsx`, `AffinityTest.jsx`.
**RF4 — Persistência local:** favoritos/decks salvos em LocalStorage → `src/hooks/useLocalStorage.js`.

**RNF1 — Responsividade:** Grid `repeat(auto-fill,minmax(215px,1fr))`, breakpoints 980/900/860/820/760/720/560/480px, header sticky com painel de navegação no mobile, testado em 390/820/1440px.
**RNF2 — Desempenho:** `useMemo` na filtragem, debounce, bundle Vite otimizado, sem dependência pesada (sem Tailwind runtime).
**RNF3 — Usabilidade/Acessibilidade:** labels/`aria-*`, foco visível, navegação por teclado, `role=status/alert` em vazio/erro.
**RNF4 — Segurança/Estabilidade:** validação (quiz incompleto, duelo igual, deck duplicado/limite, JSON inválido), try/catch no LocalStorage, rota `*` → Home.

## 5. Guia de Acesso e Execução
Repositório: `https://github.com/ragavabe/dw-II-animepowers`

Rodar localmente:
```bash
git clone https://github.com/ragavabe/dw-II-animepowers.git
cd dw-II-animepowers
npm install
npm run dev     # http://localhost:5173/poderesanime/
npm run build   # build de produção (gera dist/)
npm run preview # serve o dist localmente
npm test        # suíte Vitest
npm run lint    # oxlint
```

**Deploy:** push na `main` → `.github/workflows/deploy.yml` publica `dist/` no Pages
(Settings → Pages → “GitHub Actions”).

> ⚠️ **Verificar antes de publicar:** o `base` do Vite está em `/poderesanime/`, mas o
> reposório se chama `dw-II-animepowers`. O GitHub Pages serviria o site em
> `/dw-II-animepowers/`. Defina a variável de ambiente antes do build, sem tocar no código:
> ```bash
> VITE_BASE_PATH=/dw-II-animepowers/ npm run build
> ```
> Para um domínio próprio, use `VITE_BASE_PATH=/`.

## 6. Divisão de Tarefas do Grupo
| Integrante | Contribuição técnica | Arquivos principais |
|---|---|---|
| Nome 1 — Catálogo | Busca, filtros combináveis, URL sync, ordenação, mock JSON | `components/PowerCatalog.jsx`, `components/FilterBar.jsx`, `data/powers.json` |
| Nome 2 — Detalhes + Favoritos | Página `/poder/:id`, `useLocalStorage`, cards e estados vazios | `pages/Poder.jsx`, `components/PowerCard.jsx`, `components/EmptyState.jsx`, `hooks/` |
| Nome 3 — Duelo + Afinidade | Fórmula de duelo, afinidades, histórico, quiz de 5 perguntas, narração IA | `components/DuelSimulator.jsx`, `components/AffinityTest.jsx`, `data/elementalAffinities.js` |
| Nome 4 — Sistema visual + Grimório + Deploy | Tokens, tipografia, componentes, grimório, Router, base/Actions | `styles/`, `components/DeckBuilder.jsx`, `App.jsx`, `vite.config.js`, `deploy.yml`, `README.md` |

> Substitua os nomes pelos integrantes do grupo antes da entrega. Não liste funcionalidade não implementada.

## 7. Estrutura de pastas
```
public/
├── fonts/          Anton + Inter auto-hospedadas (woff2)
├── imagenspoderes/ artes das 54 técnicas
├── favicon.svg, manifest.json, sw.js
src/
├── components/  Header, Icons, PowerCard, PowerCatalog, FilterBar, EmptyState,
│                DuelSimulator, DeckBuilder, AffinityTest
├── pages/       Home, Catalogo, Poder, Duelo, Grimorio, Afinidade, Auth/Login/Cadastro
├── data/        powers.json, elementalAffinities.js, elementMeta.js
├── hooks/       useLocalStorage, useDebounce, useReveal
├── styles/      fonts, globals, components, layout, home, catalog, detail, duel, grimoire, auth
├── config/db.js
├── App.jsx      HashRouter + rotas
└── main.jsx
```

## 8. Sistema visual em uma página
- **Superfície:** preto real (`#000`) com neutros quentes em três degraus; separação por
  linhas de 1px, não por sombras ou gradientes.
- **Destaque:** um único sinal laranja-queimado (`--signal`), usado em botões primários,
  números-chave e estados ativos. Botão primário = fundo sinal com texto preto.
- **Elementos:** rampa `oklch` de luminosidade e croma constantes (só o matiz varia), definida
  em `data/elementMeta.js` e espelhada nas classes `.el-*`. Cada cor aparece em três lugares
  apenas: marcador do rótulo, valor da ficha e barra do atributo.
- **Forma:** raios de 2/4/6/8px. Cada componente escolhe a sua forma — trilho, índice,
  ficha e arena têm composições diferentes, não o mesmo card repetido.
- **Movimento:** entrada com fade + 28px de deslocamento, escalonada por índice
  (`useReveal` + CSS puro, sem biblioteca); zoom 107% na arte ao passar o cursor;
  sublinhado que cresce nos links; seta que abre nos botões. Tudo desligado sob
  `prefers-reduced-motion`.

## 9. Licença acadêmica
Uso educacional. Nomes/imagens de animes pertencem aos detentores.

