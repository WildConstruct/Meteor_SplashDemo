// PlaybackClock — converts wall-clock time into integer timeline frames at the
// project frame rate (build plan §7.1, §21). The engine receives explicit
// frameIndex/timeSeconds; the clock owns no GPU state.

export class PlaybackClock {
  constructor(frameRate = 30, durationFrames = 240) {
    this.frameRate = frameRate;
    this.durationFrames = durationFrames;
    this.frame = 0;
    this.playing = false;
    this._lastWall = 0;
    this._accum = 0;
    this.loop = true;
  }

  play() {
    this.playing = true;
    this._lastWall = performance.now();
  }

  pause() {
    this.playing = false;
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  reset() {
    this.frame = 0;
    this._accum = 0;
  }

  seek(frame) {
    this.frame = Math.max(0, Math.min(this.durationFrames - 1, Math.round(frame)));
  }

  /** Advance using elapsed wall time; returns the integer frame to render. */
  tick(nowMs) {
    if (this.playing) {
      const dt = (nowMs - this._lastWall) / 1000;
      this._lastWall = nowMs;
      this._accum += dt * this.frameRate;
      const whole = Math.floor(this._accum);
      if (whole > 0) {
        this._accum -= whole;
        this.frame += whole;
        if (this.frame >= this.durationFrames) {
          this.frame = this.loop ? this.frame % this.durationFrames : this.durationFrames - 1;
          if (!this.loop) this.pause();
        }
      }
    }
    return this.frame;
  }

  get timeSeconds() {
    return this.frame / this.frameRate;
  }
}
