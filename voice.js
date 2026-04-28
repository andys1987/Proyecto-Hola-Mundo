export class HoloVoice {
  constructor() {
    this.voices = [];
    this.loadVoices();
    window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
  }

  loadVoices() {
    this.voices = window.speechSynthesis.getVoices();
  }

  pickVoice() {
    const preferred = this.voices.find((v) => v.lang?.toLowerCase().startsWith('es') && /neural|premium|natural|enhanced/i.test(v.name));
    if (preferred) return preferred;

    return this.voices.find((v) => v.lang?.toLowerCase().startsWith('es')) || null;
  }

  generateVisemeTimeline(text, stepMs = 120) {
    const items = [];
    let at = 260;
    for (const char of text.toUpperCase()) {
      if ('AEIOU'.includes(char)) {
        items.push({ t: at, viseme: char });
        at += stepMs;
      } else if (char === 'M' || char === 'P' || char === 'B') {
        items.push({ t: at, viseme: 'M' });
        at += stepMs;
      } else if (char === ' ') {
        at += stepMs * 0.8;
      } else {
        at += stepMs * 0.4;
      }
    }
    items.push({ t: at + 150, viseme: 'rest' });
    return items;
  }

  speak(text, hooks = {}) {
    if (!window.speechSynthesis) return;

    const { onStart, onEnd, onViseme } = hooks;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-ES';
    utter.rate = 0.92;
    utter.pitch = 0.95;
    utter.volume = 1;

    const pickedVoice = this.pickVoice();
    if (pickedVoice) utter.voice = pickedVoice;

    utter.onstart = () => {
      if (onStart) onStart();
      const timeline = this.generateVisemeTimeline(text);
      timeline.forEach((item) => {
        setTimeout(() => {
          if (onViseme) onViseme(item.viseme);
        }, item.t);
      });
    };

    utter.onend = () => {
      if (onViseme) onViseme('rest');
      if (onEnd) onEnd();
    };

    setTimeout(() => window.speechSynthesis.speak(utter), 220);
  }
}
