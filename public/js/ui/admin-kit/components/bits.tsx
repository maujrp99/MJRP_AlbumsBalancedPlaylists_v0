// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The small pieces every screen of the kit uses: the badge, the switch, the order buttons and the notice
 * (`info-arch.md` § «O kit do admin», the components table).
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Badge({ tone = 'neutral', children }: { tone?: 'accent' | 'warn' | 'neutral' | 'new' | 'err'; children: ReactNode }) {
    return <span className={clsx('ak-badge', tone !== 'neutral' && tone)}>{children}</span>;
}

/** On or off the air: a real switch, with its state in its name; when it cannot change, it says why. */
export function Switch({ on, label, onChange, disabled, reason }: { on: boolean; label: string; onChange: (on: boolean) => void; disabled?: boolean; reason?: string }) {
    return (
        <button type="button" role="switch" className="ak-switch" aria-checked={on} disabled={disabled} title={disabled ? reason : undefined}
            onClick={() => onChange(!on)}>
            <i aria-hidden="true" />{label}
        </button>
    );
}

/** ↑ and ↓, which also stand in for dragging on the keyboard and on the phone. */
export function OrderButtons({ index, total, onMove, up, down }: { index: number; total: number; onMove: (to: number) => void; up: string; down: string }) {
    return (
        <span className="ak-order">
            <button type="button" className="ak-icon" aria-label={up} disabled={index === 0} onClick={() => onMove(index - 1)}>↑</button>
            <button type="button" className="ak-icon" aria-label={down} disabled={index === total - 1} onClick={() => onMove(index + 1)}>↓</button>
        </span>
    );
}

export function Notice({ tone = 'info', children, action }: { tone?: 'info' | 'warn' | 'err' | 'ok'; children: ReactNode; action?: ReactNode }) {
    return (
        <div className={clsx('ak-notice', tone !== 'info' && tone)} role={tone === 'err' ? 'alert' : 'status'}>
            <span>{children}</span>
            {action}
        </div>
    );
}
