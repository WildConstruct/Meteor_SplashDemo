// TimelineController — the transport UI (play/pause/scrub/reset/jump) wired to a
// PlaybackClock (build plan §4 step 12, §21). Pure DOM; emits frame changes.

import { PlaybackClock } from './PlaybackClock.js';

export class TimelineController {
  constructor(mount, { frameRate, durationFrames, onSeek }) {
    this.clock = new PlaybackClock(frameRate, durationFrames);
    this.onSeek = onSeek;
    this.mount = mount;
    this._build();
  }

  _build() {
    this.mount.innerHTML = `
      <div class="timeline">
        <button data-act="play" title="Play/Pause (Space)">▶</button>
        <button data-act="reset" title="Reset to frame 0">⏮</button>
        <input type="range" data-act="scrub" min="0" max="${this.clock.durationFrames - 1}" value="0" />
        <span class="frame-readout">0 / ${this.clock.durationFrames - 1}</span>
        <label class="loop"><input type="checkbox" data-act="loop" checked /> loop</label>
      </div>`;
    this.playBtn = this.mount.querySelector('[data-act=play]');
    this.scrub = this.mount.querySelector('[data-act=scrub]');
    this.readout = this.mount.querySelector('.frame-readout');

    this.playBtn.addEventListener('click', () => {
      this.clock.toggle();
      this._syncPlayButton();
    });
    this.mount.querySelector('[data-act=reset]').addEventListener('click', () => {
      this.clock.pause();
      this.clock.reset();
      this._syncPlayButton();
      this._emit();
    });
    this.scrub.addEventListener('input', () => {
      this.clock.pause();
      this.clock.seek(Number(this.scrub.value));
      this._syncPlayButton();
      this._emit();
    });
    this.mount.querySelector('[data-act=loop]').addEventListener('change', (e) => {
      this.clock.loop = e.target.checked;
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        this.clock.toggle();
        this._syncPlayButton();
      }
    });
  }

  _syncPlayButton() {
    this.playBtn.textContent = this.clock.playing ? '⏸' : '▶';
  }

  /** Called every animation frame by the app. */
  update(nowMs) {
    const frame = this.clock.tick(nowMs);
    if (this.clock.playing) {
      this.scrub.value = String(frame);
      this._readout(frame);
    }
    return frame;
  }

  jumpTo(frame) {
    this.clock.seek(frame);
    this.scrub.value = String(this.clock.frame);
    this._emit();
  }

  _emit() {
    this._readout(this.clock.frame);
    this.onSeek?.(this.clock.frame);
  }

  _readout(frame) {
    this.readout.textContent = `${frame} / ${this.clock.durationFrames - 1}`;
  }
}
