/**
 * TitleKeywordStrategy - Etapa 2 do Funil
 * 
 * Classifies albums by explicit patterns in the title.
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md#etapa-2-titlekeywordstrategy
 */

import { BaseStrategy } from './BaseStrategy.js';

export class TitleKeywordStrategy extends BaseStrategy {
    name = 'TitleKeyword';

    // Pattern definitions
    LIVE_PATTERNS = [
        '(live)', '[live]', 'live at', 'live from',
        'unplugged', 'in concert', 'concert live',
        'tour edition', 'tour live', 'live session'
    ];

    DJ_MIX_PATTERNS = [
        '(dj mix)', '[dj mix]', 'dj mix', 'continuous mix',
        'mixed by', 'nonstop mix', 'megamix', 'in the mix',
        'ministry of sound', 'trance nation', 'in search of sunrise',
        'gatecrasher', 'cream', 'godskitchen', 'sensation',
        'anjunabeats worldwide', 'corsten\'s countdown',
        'ultra music festival', 'electric daisy carnival',
        'tomorrowland mix', 'dreamstate'
    ];

    // Regex for numbered episodes (Group Therapy 500, ASOT 1000, etc.)
    DJ_MIX_REGEX = /^(group therapy|asot|a state of trance|pure trance|corsten's countdown)\s*\d+/i;

    SINGLE_PATTERNS = ['- single', '(single)', '[single]'];
    SINGLE_SUFFIX = / single$/i;

    EP_PATTERNS = ['- ep', '(ep)', '[ep]'];
    EP_SUFFIX = / ep$/i;

    REMIX_PATTERNS = ['remixes', 'remixed', 'remix album', 'the remixes'];

    COMPILATION_PATTERNS = [
        'best of', 'greatest hits', 'collection', 'anthology',
        'essential', 'essentials', 'definitive', 'gold',
        'classics', 'retrospective', 'complete'
    ];

    SOUNDTRACK_PATTERNS = ['soundtrack', ' ost', '(ost)', 'motion picture', 'original score', 'film score'];

    execute(album, context) {
        const title = (album.title || '').toLowerCase();

        // Live / Concert
        if (this._matchesAny(title, this.LIVE_PATTERNS)) {
            this.log(album.title, 'Live', 'title keyword');
            return 'Live';
        }

        // DJ Mixes / Radio Shows
        if (this._matchesAny(title, this.DJ_MIX_PATTERNS) || this.DJ_MIX_REGEX.test(title)) {
            this.log(album.title, 'Compilation', 'DJ Mix/Radio Show');
            return 'Compilation';
        }

        // Explicit Single marker
        if (this._matchesAny(title, this.SINGLE_PATTERNS) || this.SINGLE_SUFFIX.test(title)) {
            this.log(album.title, 'Single', 'explicit marker');
            return 'Single';
        }

        // Explicit EP marker
        if (this._matchesAny(title, this.EP_PATTERNS) || this.EP_SUFFIX.test(title)) {
            this.log(album.title, 'EP', 'explicit marker');
            return 'EP';
        }

        // Remix Albums
        if (this._matchesAny(title, this.REMIX_PATTERNS) ||
            (title.includes('remix') && !title.includes('single'))) {
            this.log(album.title, 'Compilation', 'remix album');
            return 'Compilation';
        }

        // Greatest Hits / Compilations
        if (this._matchesAny(title, this.COMPILATION_PATTERNS)) {
            this.log(album.title, 'Compilation', 'greatest hits/collection');
            return 'Compilation';
        }

        // Soundtracks
        if (this._matchesAny(title, this.SOUNDTRACK_PATTERNS)) {
            this.log(album.title, 'Compilation', 'soundtrack');
            return 'Compilation';
        }

        // No match, pass to next strategy
        return null;
    }

    _matchesAny(title, patterns) {
        return patterns.some(p => title.includes(p));
    }
}
