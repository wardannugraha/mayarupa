/* ==========================================================================
   WAYANG DIGITAL - SOUND ENGINE (Web Audio API Synthesizer & Sound Effects)
   Authentic procedural audio: Kepyak, Cempala, Gong, Gamelan Drone, Whoosh
   ========================================================================== */

export class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isGamelanPlaying = false;
        this.gamelanTimer = null;
        this.droneNodes = [];
        this.masterGain = null;
        this.gamelanGain = null;
        this.sfxGain = null;

        // Slendro / Pelog tuned frequencies (Hz) for authentic Javanese scale
        // Slendro: 1 (Panunggal/Ji) ~280Hz, 2 (Gulu/Ro) ~315Hz, 3 (Dhadha/Lu) ~360Hz, 5 (Lima/Ma) ~420Hz, 6 (Nem/Nem) ~480Hz
        this.slendroFreqs = [278.4, 316.2, 359.8, 418.6, 482.0, 556.8, 632.4, 719.6];
        this.pelogFreqs = [261.6, 280.0, 310.0, 392.0, 415.0, 440.0, 523.2];
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.85;
            this.masterGain.connect(this.ctx.destination);

            this.gamelanGain = this.ctx.createGain();
            this.gamelanGain.gain.value = 0.35;
            this.gamelanGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.9;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn("Web Audio API not initialized:", e);
        }
    }

    resumeAudio() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Kepyak: Suara lempengan besi/perunggu yang dipukul kaki dalang (Cring-crak-crak!)
     */
    playKepyak(intensity = 1.0) {
        if (!this.ctx || this.isMuted) return;
        this.resumeAudio();

        const now = this.ctx.currentTime;
        const count = 3 + Math.floor(Math.random() * 2); // Multi-plate metallic rattle

        for (let i = 0; i < count; i++) {
            const delay = i * 0.015 + (Math.random() * 0.008);
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const noise = this.createNoiseNode();
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3200 + (Math.random() * 1800);
            filter.Q.value = 4.5;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.4 * intensity, now + delay + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08 + (Math.random() * 0.04));

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(2400 + Math.random() * 800, now + delay);
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(4200 + Math.random() * 1200, now + delay);

            osc1.connect(filter);
            osc2.connect(filter);
            if (noise) noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc1.start(now + delay);
            osc2.start(now + delay);
            osc1.stop(now + delay + 0.15);
            osc2.stop(now + delay + 0.15);
            if (noise) {
                noise.start(now + delay);
                noise.stop(now + delay + 0.15);
            }
        }
    }

    /**
     * Cempala / Dodokan: Ketukan kayu keras ke kotak wayang (Dhog! Dhog!)
     */
    playCempala(intensity = 1.0) {
        if (!this.ctx || this.isMuted) return;
        this.resumeAudio();

        const now = this.ctx.currentTime;

        // Sub-bass thud (resonansi kotak kayu)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.8 * intensity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        // Click transient (pukulan kayu padat)
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(880, now);
        clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.02);

        clickGain.gain.setValueAtTime(0.6 * intensity, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        clickOsc.connect(clickGain);
        clickGain.connect(this.sfxGain);

        osc.start(now);
        clickOsc.start(now);
        osc.stop(now + 0.26);
        clickOsc.stop(now + 0.04);
    }

    /**
     * Gong Ageng: Suara dengung gong besar yang sakral dan bergetar lama (Goooong...)
     */
    playGong(pitchMultiplier = 1.0) {
        if (!this.ctx || this.isMuted) return;
        this.resumeAudio();

        const now = this.ctx.currentTime;
        const fundamental = 68 * pitchMultiplier; // Low deep frequency

        // Harmonic overtones of Javanese bronze gong
        const partials = [
            { mult: 1.0, gain: 0.9, decay: 5.5 },
            { mult: 2.02, gain: 0.5, decay: 4.2 },
            { mult: 2.76, gain: 0.35, decay: 3.5 },
            { mult: 3.88, gain: 0.2, decay: 2.8 },
            { mult: 5.12, gain: 0.12, decay: 1.8 }
        ];

        partials.forEach(p => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(fundamental * p.mult, now);
            // Subtle ombak (frequency oscillation beating)
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = 3.2; // 3.2 Hz beating
            lfoGain.gain.value = 2.5;
            lfo.connect(osc.frequency);
            lfo.start(now);
            lfo.stop(now + p.decay);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(p.gain * 0.7, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

            osc.connect(gain);
            gain.connect(this.gamelanGain);

            osc.start(now);
            osc.stop(now + p.decay + 0.1);
        });
    }

    /**
     * Suara Sabetan Wayang / Clash Tarung (Whoosh & Clatter)
     */
    playSabetan(intensity = 1.0) {
        if (!this.ctx || this.isMuted) return;
        this.resumeAudio();

        const now = this.ctx.currentTime;
        
        // Fast pitch swoosh
        const noise = this.createNoiseNode();
        if (!noise) return;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.22);
        filter.Q.value = 2.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.5 * intensity, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.25);
    }

    /**
     * Kenong / Kempul single note
     */
    playKenong(noteIndex = 2) {
        if (!this.ctx || this.isMuted) return;
        this.resumeAudio();

        const now = this.ctx.currentTime;
        const freq = this.slendroFreqs[noteIndex % this.slendroFreqs.length];

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2.01, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.gamelanGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.9);
        osc2.stop(now + 1.9);
    }

    /**
     * Gamelan Background Music (Generatif Pola Lancaran & Ayak-ayak Slendro)
     */
    toggleGamelan() {
        if (this.isGamelanPlaying) {
            this.stopGamelan();
            return false;
        } else {
            this.startGamelan();
            return true;
        }
    }

    startGamelan() {
        this.resumeAudio();
        if (this.isGamelanPlaying) return;
        this.isGamelanPlaying = true;

        let beat = 0;
        const bpm = 96; // Traditional Lancaran tempo
        const beatInterval = (60 / bpm) * 500; // 8th note interval

        this.gamelanTimer = setInterval(() => {
            if (!this.isGamelanPlaying) return;

            // Pattern: Lancaran Ricik-ricik style
            const step = beat % 16;

            // Kendang ketuk
            if (step % 2 === 0) {
                this.playKendangKetuk(step % 4 === 0 ? 0.3 : 0.15);
            }

            // Bonang melody
            const melodyNotes = [0, 2, 1, 3, 2, 4, 3, 2, 1, 3, 2, 4, 3, 2, 1, 0];
            this.playBonang(melodyNotes[step]);

            // Kenong on beat 4, 8, 12, 16
            if (step === 3) this.playKenong(1);
            if (step === 7) this.playKenong(2);
            if (step === 11) this.playKenong(3);
            
            // Gong Ageng at end of gongan (step 15)
            if (step === 15) {
                this.playKenong(0);
                this.playGong(1.0);
            }

            beat++;
        }, beatInterval);
    }

    stopGamelan() {
        this.isGamelanPlaying = false;
        if (this.gamelanTimer) {
            clearInterval(this.gamelanTimer);
            this.gamelanTimer = null;
        }
    }

    playBonang(noteIndex = 0) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const freq = this.slendroFreqs[noteIndex % this.slendroFreqs.length] * 2;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.gamelanGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playKendangKetuk(gainVal = 0.2) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.gamelanGain);

        osc.start(now);
        osc.stop(now + 0.11);
    }

    createNoiseNode() {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }
}
