// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * A gravação do kit, numa regra só (F87, REQ-04): o que o botão «Salvar» faz e o que uma peça do projeto faz ao gravar
 * pela mesma porta — confere a regra, grava com a versão lida e devolve o conteúdo limpo e a versão nova, ou a falha.
 * Pura: só as portas e as regras do kit.
 */
import type { KitFailure, KitPorts } from './ports';
import type { KitSchema } from './schema';
import { validate, type KitProblem } from './validate';
import { forStore, type KitValues } from './values';

export type KitSaveOutcome =
    | { ok: true; clean: KitValues; version: string }
    | { ok: false; reason: 'invalid'; problems: KitProblem[] }
    | { ok: false; reason: 'failed'; failure: KitFailure; message?: string };

export async function saveValues(schema: KitSchema, ports: KitPorts, values: KitValues, version: string): Promise<KitSaveOutcome> {
    const problems = validate(schema, values);
    if (problems.length) return { ok: false, reason: 'invalid', problems };
    const clean = forStore(values);
    const result = await ports.save(clean, version);
    if (!result.ok) return { ok: false, reason: 'failed', failure: result.failure, message: result.message };
    return { ok: true, clean, version: result.value.version };
}
