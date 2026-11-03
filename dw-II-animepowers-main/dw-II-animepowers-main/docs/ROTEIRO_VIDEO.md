# Roteiro Vídeo 5–10 min — Anime Powers (Não listado, título com grupo/app)

Alvo: ~8:30. Todos falam. Grave em 1080p, site já aberto no Pages em aba anônima, VS Code com zoom 150%.

## [00:00–01:30] Introdução e visão geral (todos, ~20s cada)
- 00:00–00:20 — Int.1: “Somos [Grupo X]. App Anime Powers: catálogo + duelo + grimório de poderes de anime.”
- 00:20–00:50 — Int.2: problema (info dispersa, sem comparação padronizada) + público (fãs/estudantes).
- 00:50–01:10 — Int.3: mostra home no Pages + alterna DevTools mobile.
- 01:10–01:30 — Int.4: agenda (demo → código → RF/RNF → encerramento).

## [01:30–05:00] Demonstração prática (só Pages, sem localhost)
- 01:30–02:20 — Catálogo: busca “rasengan”, depois “goku”; filtro Ninjutsu → Ki; ordena por dano. Digite “xyz” → estado vazio → Limpar filtros.
- 02:20–03:00 — Modal Kamehameha: dano/alcance/elemento/personagem; favorita ★; recarrega página (prova LocalStorage); filtra “somente favoritos”.
- 03:00–04:00 — Duelo: Rasengan vs Kamehameha → Iniciar → vencedor + HP. Repete 1x (aleatoriedade controlada). Mostra histórico.
- 04:00–04:40 — Grimório: adiciona 6, tenta 7º (erro limite), tenta duplicata (erro), Exportar JSON.
- 04:40–05:00 — Afinidade: responde quiz rápido → resultado (ex. Fogo) + Refazer.

## [05:00–07:30] Estrutura técnica e código
- 05:00–05:50 — Pastas: `components/`, `pages/`, `hooks/`, `data/powers.json`, `styles/`. Mostra `vite.config.js` (`base: '/poderesanime/'`) + `HashRouter` no `App.jsx`.
- 05:50–06:30 — `PowerCatalog.jsx`: `useState` busca/categoria, `useDebounce` 200ms, `useMemo` filtragem, `useLocalStorage`. Mostra `DuelSimulator` fórmula.
- 06:30–07:00 — Desafios: 404 no Pages → `base` + HashRouter; quota LocalStorage → try/catch; modal → ESC + `aria-modal`.
- 07:00–07:30 — Roda `npm run build` ao vivo, mostra `dist/` gerado.

## [07:30–09:00] Requisitos e divisão de papéis
- Mostra tabela RF1–RF4 e RNF1–RNF4 como atendidos (print do README).
- Cada um em 20s: “Eu fiz X nos arquivos Y, dificuldade Z e como resolvi.”
- Cita engajamento: likes + comentários 2+ linhas nos vídeos colegas.

## [09:00–10:00] Encerramento
- 09:00–09:30 — Limitações honestas (sem backend, mock) + próximos passos (PWA, +animes, testes).
- 09:30–10:00 — Agradece, tela final com QR/links repo + Pages. Fecha em até 10:00.

## Checklist gravação
- [ ] Título vídeo: “[Grupo X] Anime Powers — Catálogo e Simulador”
- [ ] Todos aparecem com áudio claro
- [ ] Sem credenciais/abas pessoais visíveis
- [ ] Links repo + Pages na descrição
