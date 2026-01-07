/**
 * AppleMetadataStrategy - Etapa 1 do Funil
 * 
 * Uses Apple Music API attributes as primary classification source.
 * Priority: native albumType > contentTraits > boolean flags (isSingle, isCompilation)
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md#etapa-1-applemetadatastrategy
 */

import { BaseStrategy } from './BaseStrategy.js';

export class AppleMetadataStrategy extends BaseStrategy {
    name = 'AppleMetadata';

    execute(album, context) {
        const attributes = album.raw?.attributes || {};

        // 1. Check native albumType (highest priority)
        // Values: 'standard', 'single', 'deluxe', 'compilation', 'ep'
        const nativeType = (attributes.albumType || '').toLowerCase();

        if (nativeType === 'ep') {
            this.log(album.title, 'EP', `albumType='${nativeType}'`);
            return 'EP';
        }
        if (nativeType === 'single') {
            this.log(album.title, 'Single', `albumType='${nativeType}'`);
            return 'Single';
        }
        if (nativeType === 'compilation') {
            this.log(album.title, 'Compilation', `albumType='${nativeType}'`);
            return 'Compilation';
        }

        // 2. Check contentTraits for Live albums
        // contentTraits is an array that may include 'live'
        const contentTraits = attributes.contentTraits || [];
        if (Array.isArray(contentTraits) && contentTraits.includes('live')) {
            this.log(album.title, 'Live', 'contentTraits includes live');
            return 'Live';
        }

        // 3. Fallback to boolean flags (older API behavior)
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
