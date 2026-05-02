export class LipSyncController {
  constructor(avatar3d) {
    this.avatar3d = avatar3d;
    this.interval = null;
  }

  start() {
    this.stop();
    this.avatar3d.setSpeaking(true);
    this.interval = setInterval(() => {
      const amp = 0.2 + Math.random() * 0.8;
      this.avatar3d.setAudioLevel(amp);
      this.avatar3d.applyViseme(amp * 0.85);
    }, 90);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.avatar3d.setSpeaking(false);
    this.avatar3d.setAudioLevel(0);
    this.avatar3d.applyViseme(0);
  }
}
