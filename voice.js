export class VoiceEngine {
  constructor() {
    this.voices = [];
    this.loadVoices();
    window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
  }

  loadVoices() { this.voices = window.speechSynthesis.getVoices(); }

  pickBestVoice() {
    const byQuality = this.voices.find((v) => /neural|premium|natural|enhanced/i.test(v.name) && /^es-(AR|ES)/i.test(v.lang));
    if (byQuality) return byQuality;
    const latam = this.voices.find((v) => /^es-AR/i.test(v.lang));
    if (latam) return latam;
    const spain = this.voices.find((v) => /^es-ES/i.test(v.lang));
    if (spain) return spain;
    return this.voices.find((v) => /^es/i.test(v.lang)) || null;
  }

  visemeTimeline(text) {
    const list = [];
    let t = 220;
    for (const c of text.toUpperCase()) {
      if ('AEIOU'.includes(c)) { list.push({ t, v: c }); t += 105; }
      else if ('MPB'.includes(c)) { list.push({ t, v: 'M' }); t += 110; }
      else if (c === ',' || c === '.') t += 200;
      else if (c === ' ') t += 70;
      else t += 45;
    }
    list.push({ t: t + 120, v: 'rest' });
    return list;
  }

  speakCEO(text, hooks = {}) {
    if (!window.speechSynthesis) return;
    const { onStart, onEnd, onViseme } = hooks;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-AR';
    utter.rate = 0.95;
    utter.pitch = 0.99;
    utter.volume = 1;

    const voice = this.pickBestVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }

    utter.onstart = () => {
      onStart?.();
      this.visemeTimeline(text).forEach(({ t, v }) => setTimeout(() => onViseme?.(v), t));
    };
    utter.onend = () => { onViseme?.('rest'); onEnd?.(); };

    setTimeout(() => window.speechSynthesis.speak(utter), 260);
  }
}
