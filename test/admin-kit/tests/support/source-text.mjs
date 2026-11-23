// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The texts of the kit's source (F332): every string, template and JSX text of a `.js`, `.ts` or `.tsx` file, comments
// left out, read by the kit's own TypeScript parser; and the same Portuguese detector as the V0's `interfaceInEnglish`
// (a letter with a Portuguese accent, or a word that is Portuguese and not English), so the kit is judged before it gets
// there the way it will be judged there.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/** Every source file under a folder, absolute (`node_modules` left out). */
export function sourceFiles(root) {
    return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(root, entry.name);
        if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(full);
        return /\.(js|ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
    });
}

/** The texts of one file: `{ line, text }`. */
export function textsOf(file) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
    const out = [];
    const visit = (node) => {
        const kind = node.kind;
        const isText = kind === ts.SyntaxKind.StringLiteral || kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || kind === ts.SyntaxKind.TemplateHead
            || kind === ts.SyntaxKind.TemplateMiddle || kind === ts.SyntaxKind.TemplateTail || kind === ts.SyntaxKind.JsxText;
        // An import's or an export's address is not a text of the interface.
        const isAddress = kind === ts.SyntaxKind.StringLiteral && (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent));
        if (isText && !isAddress) {
            const text = kind === ts.SyntaxKind.JsxText ? node.getText(source) : node.text;
            if (text.trim()) out.push({ line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, text });
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return out;
}

const PORTUGUESE_LETTERS = /[ãõçáéíóúâêôàÃÕÇÁÉÍÓÚÂÊÔÀ]/;
/** The V0's list (test/architecture/interfaceInEnglish.test.js), as it is. */
const PORTUGUESE_WORDS = [
    'faixa', 'faixas', 'cada', 'voce', 'selecione', 'curadoria', 'melhores', 'mesclando', 'pessoas',
    'realmente', 'ouvem', 'algoritmo', 'distribui', 'rodizio', 'zigue', 'curtas', 'combinadas',
    'automaticamente', 'versao', 'separada', 'estavel', 'testado', 'comparacao', 'simples',
    'variedade', 'entre', 'favoritas', 'popularidade', 'baseadas', 'aclamadas', 'balanceado',
    'balanceadas', 'revisada', 'hibrida', 'salvar', 'salvo', 'carregando', 'nenhum', 'nenhuma',
    'sucesso', 'aguarde', 'erro', 'falhou', 'tente', 'novamente', 'criar', 'criado', 'criada',
    'excluir', 'remover', 'adicionar', 'cancelar', 'confirmar', 'voltar', 'buscar', 'obrigatorio',
    'vazio', 'vazia', 'aqui', 'agora', 'ainda', 'muito', 'seus', 'suas', 'isso', 'esse', 'essa',
    'pelo', 'pela', 'nao', 'sao', 'uma', 'das', 'dos', 'com', 'sem', 'para', 'mais',
];
const NEEDS_NEIGHBOURS = new Set(['com', 'sem', 'para', 'das', 'dos', 'mais', 'entre', 'uma', 'erro', 'simples']);
const PLAIN_WORD = new RegExp(`(?<![\\w./-])(?:${PORTUGUESE_WORDS.filter((word) => !NEEDS_NEIGHBOURS.has(word)).join('|')})(?![\\w./-])`, 'i');
const WORD_IN_A_SENTENCE = new RegExp(`[a-z] (?:${[...NEEDS_NEIGHBOURS].join('|')}) [a-z]`, 'i');

/** Why a text is Portuguese, or null. */
export function portugueseIn(text) {
    if (PORTUGUESE_LETTERS.test(text)) return 'a letter with a Portuguese accent';
    const word = PLAIN_WORD.exec(text) || WORD_IN_A_SENTENCE.exec(text);
    return word ? `the Portuguese word "${word[0].trim()}"` : null;
}
