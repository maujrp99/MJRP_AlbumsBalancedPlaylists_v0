#!/usr/bin/env python3
"""Aplica a régua (tetos por tipo de elemento) ao documento de copy do V0 e escreve as medidas.

Uso: python3 apply-ruler-to-deck.py <album-blender-copy.md> <saida.json>
Lê as tabelas do documento (uma por tela), usa a coluna «Tipo» e as palavras em inglês («Pal. EN»).
Só mede: não reescreve texto.
"""
import json
import re
import sys

# tipo do documento -> (tipo da régua, alvo em palavras, teto em palavras). Ver o relatório, § Régua.
RULER = {
    'Título': ('título de seção/tela', 4, 8),
    'Botão': ('botão', 2, 4),
    'Rótulo/opção': ('opção de menu / rótulo', 2, 4),
    'Campo (placeholder)': ('placeholder', 2, 4),
    'Dica (tooltip)/título': ('dica (tooltip)', 8, 12),
    'Descrição': ('ajuda / descrição curta', 8, 12),
    'Aviso (toast)': ('aviso (toast)', 6, 10),
    'Carregando/andamento': ('carregando', 3, 6),
    'Estado vazio': ('estado vazio (corpo)', 15, 25),
    'Erro/aviso': ('erro (corpo)', 15, 25),
    'Erro (pode chegar à tela)': ('erro (corpo)', 15, 25),
    'Mensagem': ('mensagem / diálogo (corpo)', 15, 25),
    'Mensagem do servidor': ('erro (corpo)', 15, 25),
    'Confirmação/aviso do navegador': ('diálogo (corpo)', 15, 25),
    'Texto': ('parágrafo', 25, 40),
}
NOT_VISIBLE = {'Leitor de tela', 'Texto alternativo'}  # não entram no volume visível
SENTENCE_CEILING = 25  # GOV.UK: frase com mais de 25 palavras se divide


def rows(md):
    screen = None
    for line in md.splitlines():
        if line.startswith('## '):
            screen = line[3:].strip()
        elif line.startswith('| `') and screen:
            f = [x.strip() for x in line.split('|')[1:-1]]
            if len(f) >= 11:
                yield screen, f


def main(src, out):
    md = open(src, encoding='utf-8').read()
    per_screen, items = {}, []
    for screen, f in rows(md):
        tid, kind, en, words, chars = f[0].strip('`'), f[2], f[5], int(f[10]), int(f[9])
        s = per_screen.setdefault(screen, {'texts': 0, 'visible_texts': 0, 'words': 0, 'visible_words': 0,
                                           'over_target': 0, 'over_ceiling': 0, 'long_sentences': 0})
        s['texts'] += 1
        s['words'] += words
        if kind in NOT_VISIBLE:
            continue
        s['visible_texts'] += 1
        s['visible_words'] += words
        rk, target, ceiling = RULER.get(kind, ('outro', 25, 40))
        longest_sentence = max((len(x.split()) for x in re.split(r'(?<=[.!?])\s+', en) if x.strip()), default=0)
        if longest_sentence > SENTENCE_CEILING:
            s['long_sentences'] += 1
        if words > target:
            s['over_target'] += 1
        if words > ceiling:
            s['over_ceiling'] += 1
        items.append({'screen': screen, 'id': tid, 'deck_type': kind, 'ruler_type': rk, 'en': en, 'words': words,
                      'chars': chars, 'target': target, 'ceiling': ceiling, 'ratio': round(words / ceiling, 2), 'excess': words - target,
                      'longest_sentence': longest_sentence})
    worst = sorted(items, key=lambda i: (-(i['words'] - i['target']), -i['ratio']))[:25]  # o que mais passa do alvo, em palavras
    json.dump({'source': src, 'per_screen': per_screen, 'worst': worst, 'items': items}, open(out, 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    for k, v in per_screen.items():
        print(f"{k}: {v['visible_texts']} textos visíveis, {v['visible_words']} pal; acima do alvo {v['over_target']}, "
              f"acima do teto {v['over_ceiling']}, frases >25 pal {v['long_sentences']}")
    print('--- piores (palavras acima do alvo) ---')
    for i in worst[:20]:
        print(f"+{i['excess']:>2} {i['ratio']:>4} {i['words']:>3}w [{i['ruler_type']}] {i['screen']} · {i['id']}: {i['en'][:110]}")


if __name__ == '__main__':
    main(*sys.argv[1:3])
