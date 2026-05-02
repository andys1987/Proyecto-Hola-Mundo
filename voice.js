export class VoiceEngine {
  constructor() {
    this.voices = [];
    this.loadVoices();
    window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
  }

  loadVoices() { this.voices = window.speechSynthesis.getVoices(); }

  pickBestVoice() {
    const quality = this.voices.find((v) => /neural|premium|natural|enhanced/i.test(v.name) && /^es-(AR|ES)/i.test(v.lang));
    if (quality) return quality;
    return this.voices.find((v) => /^es-AR|^es-ES|^es/i.test(v.lang)) || null;
  }

  async speakCEO(text, hooks = {}) {
    const { onStart, onEnd, onAudioLevel } = hooks;
    onStart?.();

    // Hook placeholder for external TTS providers (OpenAI/ElevenLabs) when backend is added.
    const externalTTSEnabled = false;
    if (externalTTSEnabled) {
      // Keep this branch for future API integration.
    }

    if (!window.speechSynthesis) { onEnd?.(); return; }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-AR';
    utter.rate = 0.93;
    utter.pitch = 1.0;
    utter.volume = 1;

    const v = this.pickBestVoice();
    if (v) { utter.voice = v; utter.lang = v.lang; }

    let levelTimer = null;
    utter.onstart = () => {
      levelTimer = setInterval(() => onAudioLevel?.(0.25 + Math.random() * 0.7), 80);
    };
    utter.onend = () => {
      if (levelTimer) clearInterval(levelTimer);
      onAudioLevel?.(0);
      onEnd?.();
    };

    setTimeout(() => window.speechSynthesis.speak(utter), 260);
  }
}
