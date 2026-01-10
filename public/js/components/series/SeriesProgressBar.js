/**
 * SeriesProgressBar.js
 * 
 * Extracted from SeriesView.js (Sprint 19 Track A)
 * Handles inline loading progress display during album enrichment.
 */
import { InlineProgress } from '../InlineProgress.js';

export class SeriesProgressBar {
    constructor(containerId = 'loading-progress-container') {
        this.containerId = containerId;
        this.inlineProgress = null;
    }

    mount() {
        const container = document.getElementById(this.containerId);
        if (container) {
            this.inlineProgress = new InlineProgress(container);
        }
    }

    start() {
        if (this.inlineProgress) {
            this.inlineProgress.start();
        }
    }

    finish() {
        if (this.inlineProgress) {
            this.inlineProgress.finish();
        }
    }

    update(current, total, label) {
        if (this.inlineProgress) {
            this.inlineProgress.update(current, total, label);
        }
    }

    unmount() {
        if (this.inlineProgress) {
            this.inlineProgress.finish();
            this.inlineProgress = null;
        }
    }
}
