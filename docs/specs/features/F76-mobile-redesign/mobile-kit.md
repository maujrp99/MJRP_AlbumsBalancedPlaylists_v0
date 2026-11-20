# Kit do celular — F76

Para quem redesenha uma tela (TASK-02 a TASK-07). A base está pronta (TASK-01); aqui está o que reusar e as regras. As medidas e o porquê de cada uma estão em `docs/specs/design-system.md` § Celular.

## As regras (curtas)

1. **Tudo dentro da consulta de mídia.** Toda regra de CSS do celular fica dentro de `@media (max-width: 767px)`. O teste `test/architecture/phoneStylesStayOnThePhone.test.js` falha se uma regra ficar fora. `@supports`, `@keyframes` e `prefers-reduced-motion` vão **dentro** dela.
2. **Um arquivo por tela.** O CSS da sua tela vai em `public/css/mobile/<tela>.css`. Os sete já existem, vazios e já carregados: `albums.css`, `album-window.css`, `ranking.css`, `playlists.css`, `home.css`, `blend.css`, `inventory.css`. Edite só o seu: não há conflito de merge. Tela nova: arquivo novo e uma linha em `mobile/screens.css`. `mobile.css` é a base compartilhada: mude-a só para algo que toda tela usa, e diga no relatório.
3. **44 / 12 / 16.** Alvo de toque de 44x44 px, texto de 12 px no mínimo, campo e seletor a 16 px, margem lateral de 16 px (a base já dá a margem a todo filho direto de `#app`: não some outra por cima).
4. **Sem rolagem dentro de rolagem.** Nenhuma lista com altura máxima e rolagem própria dentro da página. O corpo de uma folha é o único lugar que rola sozinho.
5. **A tela de computador não muda (REQ-12).** Marcação compartilhada só muda se desenhar igual a 768 px ou mais: uma classe nova sem regra fora da consulta de mídia pode; trocar a estrutura não pode. O que é só do celular é montado só no celular (`isPhone()`), ou leva `md:hidden`.
6. **Ação só com ícone** tem `aria-label` e alvo de 44 px. `title` não existe no toque.
7. **Texto de interface em inglês**; texto de fora (título, artista, nome) entra por `textContent`/`SafeDOM` ou `escapeHtml`.

## O que existe

### «É o celular?» — `public/js/utils/isPhone.js`

```js
import { isPhone, onPhoneChange, PHONE_QUERY } from '../utils/isPhone.js'

if (isPhone()) { /* monta o que é só do celular */ }
const stop = onPhoneChange((phone) => { /* virou ou deixou de ser celular */ })   // stop() para de ouvir
```

Vem de `matchMedia('(max-width: 767px)')`; nada de farejar o navegador. Quem monta algo só no celular ouve `onPhoneChange` e desmonta (guarde o `stop` em `this.subscriptions` da view).

### Folha — `public/js/components/ui/Sheet.js`

```js
import { openSheet } from '../components/ui/Sheet.js'

const apply = SafeDOM.create('button', { type: 'button', className: 'btn btn-primary' }, 'Show albums')
const sheet = openSheet({
    variant: 'bottom',          // 'full' (tela inteira: ler, editar) ou 'bottom' (escolha curta)
    title: 'Filters',           // texto; quebra a linha, nunca é cortado
    content: filtersNode,       // Node, texto ou lista deles: o corpo, a única parte que rola
    footer: apply,              // opcional: a ação principal, sempre à vista (botões de 48 px)
    onClose: () => { /* uma vez, por qualquer caminho de fechar */ }
})
apply.addEventListener('click', () => sheet.close())
// sheet.element · sheet.body · sheet.footer · sheet.isOpen() · sheet.setTitle(text) · sheet.close()
```

Faz sozinha: prende a página de trás e devolve o lugar, prende o foco e o devolve a quem abriu, `role="dialog"` + `aria-modal`, Escape, botão de fechar de 44 px, áreas seguras, deslize de 200 ms (nenhum com «reduzir movimento»); a `bottom` tem alça, fecha por toque fora e arrastando para baixo; qualquer uma fecha se a tela deixar de ser celular. **É do celular**: pergunte `isPhone()` antes de abrir (no computador ela não tem estilo). Campo de texto dentro: use `full` (o teclado cobre a de baixo).

Classes da folha (para ajustar o seu conteúdo, não a casca): `.sheet`, `.sheet--full`, `.sheet--bottom`, `.sheet__panel`, `.sheet__header`, `.sheet__title`, `.sheet__close`, `.sheet__body`, `.sheet__footer`, `.sheet__handle`.

### As janelas que já existiam

Viraram folha pela casca, sem mudar o que têm dentro (`mobile.css` § 8). O que é de dentro é da tela dona:

| Janela | Classe de fora | Forma no celular | Dentro é de |
|---|---|---|---|
| `BaseModal` (edição do inventário, da série, detalhes da playlist, `InputModal`) | `.app-modal.app-modal--full`; partes `.app-modal__panel/__header/__title/__close/__body/__footer` | tela cheia | a tela que a abre |
| `ConfirmModal` (`BaseModal.render({ sheet: 'bottom' })`) | `.app-modal.app-modal--bottom` | de baixo | — |
| Janela do álbum (`ViewAlbumModal`) | `.modal-overlay.album-window` | tela cheia; título inteiro; capa de 64 px | TASK-03 (`album-window.css`) |
| Janela de ranking (`UserRankModal`) | `.rank-window` (já era `.fullscreen-modal`) | tela cheia com `100dvh` e áreas seguras | TASK-03 (`ranking.css`) |
| Entrar (`LoginModal`) | `.modal-overlay.login-window` | de baixo | — |
| Exportar para o Spotify | `#spotify-export-modal` | de baixo | TASK-04 |

A página de trás de todas elas é presa por `components/ui/windowsHoldThePage.js`, que observa o `body`. Uma janela nova fora do `BaseModal` e da `Sheet` precisa entrar na lista `APP_WINDOWS` de lá (melhor: use a `Sheet`).

### Barra do topo e barra de baixo — `components/navigation/PhoneShell.js`

Montadas pelo `app.js` só no celular. A barra do topo diz o nome da tela pelo endereço (`phoneTabs.js` → `screenName`). Para um nome mais exato (a série aberta, por exemplo):

```js
import { nameThisScreen } from '../components/navigation/PhoneShell.js'
nameThisScreen(series.name)     // vale até a próxima tela; no computador não faz nada
```

Os cinco destinos e a qual deles cada endereço pertence estão em `PHONE_TABS` (`phoneTabs.js`). O menu (`PhoneMenu.js`) abre pela barra do topo. A página já tem o espaço das duas barras: **não** some `padding-top`/`padding-bottom` para elas.

Camadas (z-index): barras 40 · barra de ação 39 · voltar ao topo 38 · janelas antigas 50 ou mais · folha 1000 · avisos 9999. Um elemento `sticky` da sua tela deve ficar abaixo de 38 e colar em `top: calc(var(--phone-topbar-h) + var(--phone-safe-top))`.

### Barra de ação — `.phone-action-bar`

A ação principal da tela, presa acima da barra de baixo:

```html
<div class="phone-action-bar md:hidden">
  <span class="phone-action-bar__note">3 albums chosen</span>
  <button class="btn btn-primary">Create series</button>
</div>
```

`md:hidden` esconde no computador (lá a classe não tem regra). A tela ganha o espaço da barra sozinha (`body:has(.phone-action-bar)`), e o «voltar ao topo» sobe. Um ou dois botões; mais que isso vai para uma folha de baixo.

### Voltar ao topo

Já existe em toda tela (aparece depois de duas telas de rolagem). Nada a fazer.

### Classes de apoio

| Classe | O que faz |
|---|---|
| `.tap-44` | o controle mantém o tamanho e responde em 44x44 (área por pseudo-elemento). Só para controle com 8 px ou mais até o vizinho, e que não use `::after` |
| `.tap-44-box` | o próprio controle cresce para 44x44, com o desenho no meio |
| `.btn`, `.btn-sm`, `.btn-icon`, `select`, campos de texto | já têm 44 px de altura no celular; campos e seletores já estão a 16 px |
| `text-[9px]`, `text-[10px]`, `text-[11px]` | já sobem para 12 px dentro de `#app` e das janelas |

Variáveis (só existem no celular): `--phone-topbar-h` (48px), `--phone-tabbar-h` (56px), `--phone-action-bar-h` (64px), `--phone-gutter` (16px), `--phone-gutter-left/right` (com a área segura), `--phone-safe-top/bottom`, `--phone-target` (44px), `--phone-sheet-bg`, `--phone-accent`, `--phone-slide` (200ms).

Ícones novos em `Icons.js`: `Home`, `Blend`, `ArrowUp`, `ChevronRight`, `SignOut`.

## Medir

```sh
npx vite --port 5183 --strictPort --host 127.0.0.1        # do seu worktree (5010 é do MJRP)
node reports/evidence/F76/shoot.mjs after                  # capturas e medidas, 393x852, 852x393, 1280x800
python3 reports/evidence/F76/summary.py after              # uma linha por tela: largura, texto < 12, campo < 16, alvo < 44
node reports/evidence/F76/sheets.mjs after                 # o menu, a folha e as janelas abertas
python3 reports/evidence/F76/compare.py                    # 1280x800 e 852x393: antes e depois, pixel a pixel e por medidas
```

`before/` foi tirado da `main` (26eb01b). Sem login o Chrome sem cabeça só chega às telas vazias: o que depende de dados (séries, playlists, inventário) é provado pelo integrador.

## O que a base achou e é de uma tela

Medido a 393x852, sem login (`reports/evidence/F76/after/measures.json`):

- **Home (TASK-05):** `#btnModeVisual`/`#btnModeBulk` (24 px de altura), os seis filtros de tipo `#btnFilter*` (28 a 30 px; a fila rola de lado dentro da própria caixa, com «Compendiums» cortado), o conjunto escolhido longe da grade, «Initialize» no fim. A raiz da Home tem `overflow-y-auto`: conferir que não vira rolagem dentro de rolagem com dados.
- **Albums (TASK-02):** `#viewModeGrid`/`#viewModeList` (40 e 38 px); a barra de filtros ainda empilha seis controles antes do primeiro álbum (agora mais altos: 44 px cada); o botão de lista continua visível; cabeçalhos de série e cartões só aparecem com dados.
- **Inventário (TASK-07):** `#currencySelector` (41x26).
- **Menu:** o botão «Connect» do Spotify (`SpotifyConnectButton`, 109x30) é compartilhado com a barra de computador: quem o ajustar para o celular faz por CSS dentro da consulta (`.phone-menu__spotify button`).
- **Ranking (TASK-03):** a casca está pronta; a dica do rodapé e as linhas são de dentro.
- **Aviso próprio do ranking:** `UserRankModal` cria o próprio aviso no `body` (não usa o `Toast`): no celular ele não segue a regra «abaixo da barra do topo».
- **Tamanhos em `style=""` ou em CSS de tela** abaixo de 12 px não são alcançados pela base (ela sobe as classes `text-[9px]`, `[10px]`, `[11px]`).
