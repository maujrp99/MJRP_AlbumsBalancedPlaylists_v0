/**
 * AppleMetadataStrategy - Etapa 1 do Funil
 * 
 * Uses Apple Music API flags (isSingle, isCompilation) as primary initial source.
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md#etapa-1-applemetadatastrategy
 */

import { BaseStrategy } from './BaseStrategy.js';

export class AppleMetadataStrategy extends BaseStrategy {
    name = 'AppleMetadata';

    execute(album, context) {
        const attributes = album.raw?.attributes || {};

        // Check explicit Apple Music flags
        if (attributes.isSingle === true) {
            this.log(album.title, 'Single', 'isSingle=true');
            return 'Single';
        }

        if (attributes.isCompilation === true) {
            this.log(album.title, 'Compilation', 'isCompilation=true');
            return 'Compilation';
        }

        // No explicit flags, pass to next strategy
        return null;
    }
}
