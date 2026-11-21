#!/usr/bin/env python3
"""F81 — turn the scan (scan-copy.cjs --out scan.json) into the copy-deck rows.

  python3 scripts/i18n/build-deck.py scan.json rows.json            # step 1: rows (en only)
  python3 scripts/i18n/build-deck.py scan.json rows.json --render design/copy/album-blender-copy.md \
         --pt design/copy/album-blender-pt.json                      # step 2: the document

One row per distinct English text (IA-02: one concept, one label). Every place the text appears is kept.
The pt-BR column comes only from --pt (the agent's proposal, never final).
"""
import json, re, sys, hashlib, collections, argparse

ap = argparse.ArgumentParser()
ap.add_argument('scan'); ap.add_argument('rows')
ap.add_argument('--render'); ap.add_argument('--pt'); ap.add_argument('--ids', help='registry text -> id; ids already in it are never changed (they become CMS keys)')
a = ap.parse_args()
scan = json.load(open(a.scan))

# ---- not copy, with the reason (kept in the document, section «Fora deste mapa») ----
EXCLUDE = [
    (r'^(Backspace|HTTP \{\}|Accept|Bearer \{\})$', 'tecla ou cabeçalho técnico, não aparece na tela'),
    (r'^(crosby, stills|robert plant|.*&.*) ', None),
]
NOT_COPY_EXACT = {'Backspace', 'HTTP {}', 'Bearer {}', 'Accept', 'Authorization', 'Content-Type'}
TECH = re.compile(r'(must be implemented|\(\) |::-webkit|\{ ?width|crypto\.randomUUID|APPLE_MUSIC_PRIVATE_KEY|is not an object of prompts|Unknown (AI provider|error code)|^\.|font-|\bpx\b;)')
DEVNAMES = re.compile(r'^(Base Algorithm)$')

def screen_of(f):
    p = f.replace('public/js/', '')
    table = [
        (r'^public/index\.html', 'Página base (index.html)'), (r'^public/splash', 'Página de entrada'),
        (r'^server/', 'Servidor'), (r'^components/(home|HomeDock)|views/HomeView|controllers/HomeController|models/home', 'Home (montar a série)'),
        (r'components/TopNav|components/navigation|components/Footer|views/BaseView|router|app\.js', 'Menu, rodapé e aplicação'),
        (r'LoginModal|AuthNav|Auth|firebase|Spotify(Connect|Auth)|MusicKit|AppleMusicConnect', 'Conta e conexões (login, Spotify, Apple Music)'),
        (r'blend|Blend', 'Blend'), (r'inventory|Inventory', 'Inventário'),
        (r'SavedPlaylist|playlists/|Playlists|PlaylistsView|batchNaming|SpotifyExport|AppleMusicExport', 'Playlists'),
        (r'ranking|Rank|Tracks|TrackRow|rankWindow', 'Ranking e faixas'),
        (r'series|Series|album-picker|albums/|Album|albumLoad|scanState|albumAsk|askedAlbum|album-search|popularity', 'Séries e álbuns'),
        (r'ui/|Toast|Sheet|Modal|Pager|Filter|Card', 'Componentes comuns (modais, filtros, paginação, avisos)'),
        (r'algorithms|ranking/', 'Algoritmos e receitas do Blend'),
        (r'ComingSoon', 'Em breve'),
    ]
    for pat, name in table:
        if re.search(pat, f if f.startswith('server') or f.startswith('public/s') or f.endswith('.html') else p):
            return name
    return 'Outros'

def kind_type(r):
    t, k, c = r['text'], r['kind'], r['ctx']
    if k.startswith('html-title') or c == 'title': return 'Aba do navegador'
    if 'aria-label' in c or 'aria-description' in c: return 'Leitor de tela'
    if '[alt]' in c or 'html[alt]' in c: return 'Texto alternativo'
    if 'placeholder' in c: return 'Campo (placeholder)'
    if 'html[title]' in c or c.startswith('{title:}') and len(t) < 60 or 'setAttribute(title)' in c or c == '.title =': return 'Dica (tooltip)/título'
    if k == 'server-message': return 'Mensagem do servidor'
    if k == 'error-text': return 'Erro (pode chegar à tela)'
    if 'confirm' in c or 'alert' in c or 'prompt' in c: return 'Confirmação/aviso do navegador'
    if 'toast' in c or 'showToast' in c: return 'Aviso (toast)'
    if re.search(r'^(Loading|Reading|Saving|Adding|Creating|Blending|Connecting|Authorizing|Exporting)', t) or t.endswith('…') or t.endswith('...'): return 'Carregando/andamento'
    if re.match(r'^(No |Nothing |Your .* is empty)', t): return 'Estado vazio'
    if re.search(r'(could not|Could not|Failed|failed|did not|not saved|Try again|went wrong|error)', t): return 'Erro/aviso'
    if re.search(r'SafeDOM\.(button)|arg of (button|readButton|rowButton)|^\{\}$', c): return 'Botão'
    if 'SafeDOM.h' in c or '{heading:}' in c or 'heading()' in c: return 'Título'
    if '{description:}' in c or '{hint:}' in c or '{caption:}' in c: return 'Descrição'
    if '{label:}' in c or 'SafeDOM.label' in c or 'field()' in c or 'SafeDOM.option' in c: return 'Rótulo/opção'
    if '{message:}' in c: return 'Mensagem'
    if 'html-text' in c or k == 'html-text': return 'Texto'
    return 'Texto'

def has_vars(t): return '{}' in t

rows = collections.OrderedDict()
excluded = []
fixture = []
for r in scan:
    if r['tier'] == 'fixture': fixture.append(r); continue
    t = r['text']
    base = t.strip()
    if base in NOT_COPY_EXACT or TECH.search(base) or DEVNAMES.match(base) or re.fullmatch(r'[\W\d_{}]+', base):
        excluded.append({**r, 'why': 'técnico ou sem letras: não é lido por uma pessoa'}); continue
    if r['file'].startswith('server/') and r['kind'] != 'server-message':
        excluded.append({**r, 'why': 'servidor: log, erro interno, configuração ou prompt de IA; o cliente recebe só um código (`code`, `retryable`), nunca este texto'}); continue
    key = re.sub(r'\s+', ' ', base)
    row = rows.setdefault(key, {'en': key, 'places': [], 'types': collections.Counter(), 'tiers': set(), 'screens': collections.Counter()})
    row['places'].append(f"{r['file']}:{r['line']}")
    row['types'][kind_type(r)] += 1
    row['tiers'].add(r['tier'])
    row['screens'][screen_of(r['file'])] += 1

def slug(t):
    s = re.sub(r'\{\}', 'n', t.lower())
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return '-'.join(s.split('-')[:5]) or 'txt'
PREFIX = {'Página base (index.html)': 'idx', 'Página de entrada': 'ent', 'Servidor': 'srv', 'Home (montar a série)': 'home', 'Menu, rodapé e aplicação': 'nav',
          'Conta e conexões (login, Spotify, Apple Music)': 'acct', 'Blend': 'blend', 'Inventário': 'inv', 'Playlists': 'pl', 'Ranking e faixas': 'rank',
          'Séries e álbuns': 'ser', 'Componentes comuns (modais, filtros, paginação, avisos)': 'ui', 'Algoritmos e receitas do Blend': 'alg', 'Em breve': 'soon', 'Outros': 'misc'}
import os
registry = json.load(open(a.ids)) if a.ids and os.path.exists(a.ids) else {}
used = set(registry.values()); out = []
for key, row in rows.items():
    screen = sorted(row['screens'].items(), key=lambda kv: (-kv[1], kv[0] in ('Página de entrada', 'Página base (index.html)')))[0][0]
    multi = len(row['screens']) > 1
    if key in registry:
        rid = registry[key]
    else:
        base = f"{PREFIX[screen]}.{slug(key)}"
        i = 1; rid = base
        while rid in used:
            i += 1; rid = f"{base}-{i}"
        used.add(rid); registry[key] = rid
    typ = row['types'].most_common(1)[0][0]
    out.append({'id': rid, 'screen': screen, 'also_on': sorted(set(row['screens']) - {screen}), 'type': typ, 'en': key,
                'built': has_vars(key), 'tier': 'provável' if row['tiers'] == {'maybe'} else 'certo', 'places': row['places']})
if a.ids: json.dump(registry, open(a.ids, 'w'), ensure_ascii=False, indent=0, sort_keys=True)
json.dump({'rows': out, 'excluded': excluded, 'fixture': fixture}, open(a.rows, 'w'), ensure_ascii=False, indent=1)
print(json.dumps({'rows': len(out), 'excluded': len(excluded), 'sites': sum(len(r['places']) for r in out)}))

# product vocabulary: every row with the word gets «MJRP decide» + the reason (the agent's proposal is in the PT column)
VOCAB = [
    (r'\bBlend(ing)?\b(?! (your|it|ready))|\bBlend\b', 'D-01 «Blend»: palavra do produto; proposta: fica «Blend» como substantivo'),
    (r'\b[Ss]eries\b|\b[Ss]erie\b', 'D-02 «Series»: proposta: traduzir por «Série(s)»'),
    (r'Compendium', 'D-03 «Compendiums»: proposta: «Coletâneas»'),
    (r'Deep Cut', 'D-04 «Deep Cuts»: proposta: fica (termo de quem coleciona)'),
    (r'Greatest Hit', 'D-04 «Greatest Hits»: proposta: «Maiores sucessos»; é também nome de playlist gravado'),
    (r'\b[Bb]atch\b', 'D-05 «Batch»: proposta: «Lote»'),
    (r'\b[Ii]nventory\b|\b[Cc]ollection\b', 'D-06 «Inventory»/«Collection»: dois rótulos para um conceito; proposta: um só, «Coleção»'),
    (r'\bOwned\b', 'D-06 «Owned»: proposta: «Tenho» / «Não tenho»'),
    (r'^(Home|Start)$|Go to Home', 'D-07 «Home»/«Start»: F85 decidiu «Start» / «Inicie»; resta os textos que ainda dizem «Home»'),
    (r'\bRecipe\b|Ingredient|Round Robin', 'D-08 receita/ingredientes: metáfora de cozinha; proposta: traduzir'),
    (r'\bRank(ing)?\b|\bPopularity\b', 'D-09 «Rank»/«Popularity»: proposta: «Ranking», «Popularidade»'),
]
def vocab(en):
    return [why for pat, why in VOCAB if re.search(pat, en)]

if a.render:
    pt = {x['id']: x for x in json.load(open(a.pt))} if a.pt else {}
    esc = lambda t: t.replace('|', '\\|').replace('\n', ' ')
    n = len(out)
    tw = lambda t: len(t.split())
    L = ['# Documento de copy: The Album Blender (site inteiro, inglês → português do Brasil)', '',
         '- **Fonte:** o código em `public/` e `server/` (`scripts/i18n/scan-copy.cjs` + `scripts/i18n/build-deck.py`; gerado, não editar à mão: rode de novo). Mesma forma do deck do MJRPpersonal (`design/copy/2026-11-07-copy-deck-pagina-principal.md`).',
         f'- **English:** {n} textos distintos em {sum(len(r["places"]) for r in out)} pontos do código; é o texto **em produção hoje, a revisar**. Nenhum está marcado final.',
         f'- **Português:** {n} de {n} propostos pelo agente (Sonnet), **tradução do agente, a revisar**; nenhum aprovado. A coluna «Nota» diz o que precisa do MJRP.',
         '- **Final** é marca do MJRP, feita por ele na página de revisão; nenhuma linha daqui foi marcada por agente.',
         '- **Medidas** (colunas Car./Pal.): caracteres e palavras do texto como está no código, com cada `{}` contado como um caractere e uma palavra; só medida, sem julgamento. Totais por tela abaixo de cada título. O que cabe sem rolar a 1280 e a 393 px **não foi medido** (precisa do navegador com conta e dados: sensor da F84).',
         '- **Limite:** a revisão muda o texto de uma linha; não tira, não põe e não move item de tela.', '']
    order = ['Página base (index.html)', 'Página de entrada', 'Menu, rodapé e aplicação', 'Conta e conexões (login, Spotify, Apple Music)', 'Home (montar a série)', 'Séries e álbuns',
             'Ranking e faixas', 'Blend', 'Algoritmos e receitas do Blend', 'Playlists', 'Inventário', 'Componentes comuns (modais, filtros, paginação, avisos)', 'Em breve', 'Servidor', 'Outros']
    by = collections.defaultdict(list)
    for r in out: by[r['screen']].append(r)
    for sc in order:
        rs = by.get(sc)
        if not rs: continue
        pe = [pt.get(r['id'], {}).get('pt', '') for r in rs]
        L += [f'## {sc}', '', f'Totais da tela: {len(rs)} textos · English {sum(len(r["en"]) for r in rs)} caracteres, {sum(tw(r["en"]) for r in rs)} palavras · Português {sum(map(len, pe))} caracteres, {sum(map(tw, pe))} palavras.', '',
              '| ID | Onde aparece | Tipo | Português | Status PT | English | Status EN | Car. PT | Pal. PT | Car. EN | Pal. EN | Nota |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
        for r in rs:
            x = pt.get(r['id'], {})
            places = r['places']; pl = ', '.join(f'`{q.replace("public/js/","").replace("public/","")}`' for q in places[:2]) + (f' +{len(places)-2}' if len(places) > 2 else '')
            where = f"{r['screen']} · {r['type']}" + (' (também em: ' + '; '.join(r['also_on']) + ')' if r['also_on'] else '') + f'; {pl}'
            note = x.get('mark', '—')
            v = vocab(r['en'])
            if v and 'MJRP decide' not in note: note += ' + MJRP decide'
            if v and not x.get('why'): note += ' — ' + '; '.join(v)
            if x.get('why'): note += f' — {x["why"]}'
            if r['tier'] == 'provável': note += ' + provável (uso não provado pela busca)'
            ptx = x.get('pt', '')
            L.append(f"| `{r['id']}` | {esc(where)} | {r['type']} | {esc(ptx or '—')} | tradução do agente, a revisar | {esc(r['en'])} | em produção, a revisar | {len(ptx)} | {tw(ptx)} | {len(r['en'])} | {tw(r['en'])} | {esc(note)} |")
        L.append('')
    L += ['## Fora deste mapa', '',
          '- **Nomes de álbuns, artistas e faixas** vindos dos catálogos (Apple Music, Spotify, Discogs, BestEverAlbums): nunca se traduzem.',
          '- **Capas e álbuns fictícios da página de entrada** (`public/splash/covers.js`): dado de demonstração, não texto de interface; o texto em volta (`{} · fictional album`) está no mapa.',
          '- **Destinos de links internos:** não são copy.',
          f'- **Candidatos descartados pelo script ({len(excluded)}):** técnicos, sem letras, ou do servidor (log, configuração, prompt de IA). Lista em `design/copy/album-blender-excluded.md`.', '']
    open(a.render, 'w').write('\n'.join(L))
    ex = ['# Candidatos descartados pelo script de busca', '', '| Arquivo:linha | Texto | Motivo |', '|---|---|---|']
    for e in excluded: ex.append(f"| `{e['file']}:{e['line']}` | {esc(e['text'][:90])} | {e['why']} |")
    open(a.render.replace('-copy.md', '-excluded.md'), 'w').write('\n'.join(ex) + '\n')
    print('rendered', a.render)
