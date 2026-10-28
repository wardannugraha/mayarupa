/* ==========================================================================
   WAYANG DIGITAL - MAIN APPLICATION CONTROLLER
   Integrates HandTracker, Puppets, Sound, Particles, Canvas Rendering & UI
   ========================================================================== */

import { SoundEngine } from './SoundEngine.js';
import { PuppetRig } from './PuppetRig.js';
import { ParticleSystem } from './Particles.js';
import { SceneManager, SCENE_PRESETS } from './SceneManager.js';
import { HandTracker } from './HandTracker.js';
import { WAYANG_DATABASE } from './WayangCharacters.js';

class WayangDigitalApp {
    constructor() {
        this.canvas = document.getElementById('kelirCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.video = document.getElementById('webcamVideo');
        this.debugCanvas = document.getElementById('debugHandCanvas');

        // Engines
        this.soundEngine = new SoundEngine();
        this.sceneManager = new SceneManager(this.canvas);
        this.particleSystem = new ParticleSystem();
        this.handTracker = new HandTracker(
            this.video,
            this.debugCanvas,
            (hands) => this.handleHandsDetected(hands)
        );

        // Control Mode: 'dual' (2 Wayang: Tangan Kiri & Kanan) or 'solo' (1 Wayang: 2 Tangan)
        this.controlMode = 'dual';

        // Puppets (Left & Right)
        this.puppetLeft = new PuppetRig('puppet_left', 'gatotkaca', 350, 520, 1);
        this.puppetRight = new PuppetRig('puppet_right', 'buto', 850, 520, -1);

        // Screen Shake effect
        this.screenShake = 0;

        // Interaction state
        this.mouseControl = {
            active: false,
            targetPuppet: this.puppetLeft,
            isDown: false
        };

        // Animation loop
        this.lastTime = performance.now();
        this.fps = 60;

        // HUD State
        this.isHudVisible = true;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.setupUIEvents();
        this.setupKeyboardShortcuts();
        this.setupMouseEvents();

        // Start Hand Tracker
        this.handTracker.init();

        // Start render loop
        requestAnimationFrame((t) => this.renderLoop(t));

        // Initial Dalang Welcome Notification
        console.log("🕉️ Wayang Digital Virtual Dalang siap dimainkan!");
    }

    resizeCanvas() {
        const container = document.getElementById('stageContainer');
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Reposition puppets relatively
        if (this.puppetLeft) {
            this.puppetLeft.targetY = this.height * 0.72;
            this.puppetLeft.y = this.puppetLeft.targetY;
        }
        if (this.puppetRight) {
            this.puppetRight.targetY = this.height * 0.72;
            this.puppetRight.y = this.puppetRight.targetY;
        }
    }

    /**
     * Pemrosesan Landmark Tangan dari AI HandTracker ke Gerakan Wayang
     */
    handleHandsDetected(hands) {
        if (!hands || hands.length === 0) return;

        const w = this.width;
        const h = this.height;
        const gedebogFloorY = h * 0.74;

        if (this.controlMode === 'dual') {
            // MODE DUAL: Tangan 0 / Kiri -> Wayang Kiri, Tangan 1 / Kanan -> Wayang Kanan
            hands.forEach((hand) => {
                const isLeftHand = (hand.label === 'Left' || hand.wrist.x < 0.5);
                const puppet = isLeftHand ? this.puppetLeft : this.puppetRight;

                if (!puppet) return;

                // 1. Petakan Posisi Pergelangan Tangan ke Koordinat Panggung
                const targetScreenX = hand.wrist.x * w;
                const targetScreenY = Math.min(gedebogFloorY, Math.max(h * 0.25, hand.wrist.y * h));

                puppet.targetX = targetScreenX;
                puppet.targetY = targetScreenY;

                // 2. Inverse Kinematics Lengan Tangan Wayang
                // Gerakan jari telunjuk & jempol mengontrol sudut ayunan lengan wayang
                const relArmX = (hand.indexTip.x - hand.wrist.x) * (isLeftHand ? 260 : -260);
                const relArmY = (hand.indexTip.y - hand.wrist.y) * 260;

                puppet.solveArmIK(isLeftHand ? 'right' : 'left', relArmX, relArmY);

                // 3. Deteksi Gestur Sabetan Serangan / Nyempurit (Pinch)
                if (hand.isPinching) {
                    if (puppet.triggerAttack()) {
                        this.soundEngine.playSabetan(1.0);
                        this.soundEngine.playKepyak(0.8);
                        this.triggerScreenShake(4);
                    }
                }
            });
        } else if (this.controlMode === 'solo') {
            // MODE SOLO: 1 Wayang Utama dimainkan dengan 2 tangan dalang
            const mainPuppet = this.puppetLeft;

            if (hands.length === 1) {
                const hand = hands[0];
                mainPuppet.targetX = hand.wrist.x * w;
                mainPuppet.targetY = Math.min(gedebogFloorY, Math.max(h * 0.25, hand.wrist.y * h));
                mainPuppet.solveArmIK('right', (hand.indexTip.x - hand.wrist.x) * 260, (hand.indexTip.y - hand.wrist.y) * 260);
            } else if (hands.length >= 2) {
                const h1 = hands[0].wrist.x < hands[1].wrist.x ? hands[0] : hands[1]; // Left
                const h2 = hands[0].wrist.x < hands[1].wrist.x ? hands[1] : hands[0]; // Right

                // Posisi tengah badan wayang
                mainPuppet.targetX = ((h1.wrist.x + h2.wrist.x) / 2) * w;
                mainPuppet.targetY = Math.min(gedebogFloorY, Math.max(h * 0.25, ((h1.wrist.y + h2.wrist.y) / 2) * h));

                // Tangan kiri mengontrol tangan kiri wayang
                mainPuppet.solveArmIK('left', (h1.indexTip.x - h1.wrist.x) * 260, (h1.indexTip.y - h1.wrist.y) * 260);
                // Tangan kanan mengontrol tangan kanan wayang
                mainPuppet.solveArmIK('right', (h2.indexTip.x - h2.wrist.x) * 260, (h2.indexTip.y - h2.wrist.y) * 260);

                if (h1.isPinching || h2.isPinching) {
                    if (mainPuppet.triggerAttack()) {
                        this.soundEngine.playKepyak(0.8);
                    }
                }
            }
        }

        // 4. Deteksi Tabrakan / Pertarungan (Clash Detection)
        this.checkPuppetClash();
    }

    /**
     * Deteksi Tabrakan Wayang & Pemicu Efek Percikan Suara Tarung
     */
    checkPuppetClash() {
        if (this.controlMode !== 'dual') return;
        const p1 = this.puppetLeft;
        const p2 = this.puppetRight;

        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const clashThreshold = 140;

        if (dist < clashThreshold) {
            const relSpeed = Math.hypot(p1.vx - p2.vx, p1.vy - p2.vy);
            if (relSpeed > 4.0) {
                // Trigger Sabetan & Kepyak
                this.soundEngine.playSabetan(1.2);
                this.soundEngine.playKepyak(1.0);

                // Percikan api tarung
                const clashMidX = (p1.x + p2.x) / 2;
                const clashMidY = (p1.y + p2.y) / 2 - 40;
                this.particleSystem.createClashSparks(clashMidX, clashMidY, 25);

                // Screen shake
                this.triggerScreenShake(7);

                // Tolakan kecil
                p1.x -= p1.facing * 15;
                p2.x -= p2.facing * 15;
            }
        }
    }

    triggerScreenShake(intensity = 6) {
        this.screenShake = Math.max(this.screenShake, intensity);
    }

    /**
     * Game / Render Loop Utama (60 FPS)
     */
    renderLoop(currentTime) {
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // 1. Update Physics & States
        this.sceneManager.update(dt);
        this.puppetLeft.update(dt);
        this.puppetRight.update(dt);

        // Blencong follows center of action
        const centerX = (this.puppetLeft.x + this.puppetRight.x) / 2;
        this.sceneManager.blencong.targetX = centerX;

        // 2. Clear Screen
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 3. Screen Shake Translation
        this.ctx.save();
        if (this.screenShake > 0.1) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
            this.screenShake *= 0.88;
        }

        // 4. Draw Kelir Background & Blencong Glow
        this.sceneManager.drawBackground(this.width, this.height);

        // 5. Draw Particles (Smoke & Embers)
        this.particleSystem.updateAndDraw(
            this.ctx,
            this.width,
            this.height,
            this.sceneManager.blencong
        );

        // 6. Draw Puppets (Left & Right)
        this.puppetLeft.draw(this.ctx, true);
        if (this.controlMode === 'dual') {
            this.puppetRight.draw(this.ctx, true);
        }

        // 7. Draw Gedebog Pisang (Bottom Banana Trunk)
        this.sceneManager.drawGedebogPisang(this.width, this.height);

        // 8. Draw Stage Golden Carved Border Frame
        this.sceneManager.drawStageFrame(this.width, this.height);

        this.ctx.restore();

        requestAnimationFrame((t) => this.renderLoop(t));
    }

    /**
     * Setup Keyboard Shortcuts untuk Dalang
     */
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.code) {
                case 'Space': // Kepyak Dalang
                    e.preventDefault();
                    this.soundEngine.playKepyak(1.0);
                    this.triggerScreenShake(3);
                    this.showFeedbackBadge("🔊 KEpyAK!");
                    break;
                case 'KeyK': // Cempala / Dodokan Kotak
                    this.soundEngine.playCempala(1.0);
                    this.triggerScreenShake(4);
                    this.showFeedbackBadge("🪵 CEMPALA!");
                    break;
                case 'KeyG': // Toggle Gamelan
                    const playing = this.soundEngine.toggleGamelan();
                    this.updateGamelanBtnState(playing);
                    this.showFeedbackBadge(playing ? "🎵 GAMELAN: ON" : "🔇 GAMELAN: OFF");
                    break;
                case 'KeyF': // Fullscreen Projector Mode
                    this.toggleFullscreen();
                    break;
                case 'KeyH': // Toggle HUD
                case 'Tab':
                    e.preventDefault();
                    this.toggleHud();
                    break;
                case 'Digit1':
                    this.selectScene('jejer');
                    break;
                case 'Digit2':
                    this.selectScene('garagara');
                    break;
                case 'Digit3':
                    this.selectScene('perangkembang');
                    break;
                case 'Digit4':
                    this.selectScene('baratayudha');
                    break;
            }
        });
    }

    /**
     * Mouse / Touch Simulation Controls
     */
    setupMouseEvents() {
        const stage = document.getElementById('stageContainer');

        stage.addEventListener('mousedown', (e) => {
            this.soundEngine.resumeAudio();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Tentukan wayang mana yang lebih dekat dengan kursor
            const distLeft = Math.hypot(mouseX - this.puppetLeft.x, mouseY - this.puppetLeft.y);
            const distRight = Math.hypot(mouseX - this.puppetRight.x, mouseY - this.puppetRight.y);

            this.mouseControl.targetPuppet = distLeft < distRight ? this.puppetLeft : this.puppetRight;
            this.mouseControl.isDown = true;

            this.mouseControl.targetPuppet.targetX = mouseX;
            this.mouseControl.targetPuppet.targetY = mouseY;
        });

        stage.addEventListener('mousemove', (e) => {
            if (!this.mouseControl.isDown) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const puppet = this.mouseControl.targetPuppet;
            puppet.targetX = mouseX;
            puppet.targetY = Math.min(this.height * 0.74, Math.max(this.height * 0.2, mouseY));

            // Ayunkan tangan mengikuti pergerakan kursor
            const relX = (mouseX - puppet.x) * 1.5;
            const relY = (mouseY - puppet.y) * 1.5;
            puppet.solveArmIK('right', relX, relY);

            this.checkPuppetClash();
        });

        window.addEventListener('mouseup', () => {
            this.mouseControl.isDown = false;
        });
    }

    /**
     * UI Buttons and Selectors Binding
     */
    setupUIEvents() {
        // Start Camera Button
        const startCamBtn = document.getElementById('startCameraBtn');
        const camStatusText = document.getElementById('camStatusText');

        if (startCamBtn) {
            startCamBtn.addEventListener('click', async () => {
                this.soundEngine.resumeAudio();
                startCamBtn.disabled = true;
                startCamBtn.innerText = "⏳ Membuka Kamera...";

                const ok = await this.handTracker.startCamera();
                if (ok) {
                    startCamBtn.innerText = "🛑 Matikan Kamera";
                    startCamBtn.classList.add('active');
                    camStatusText.innerText = "✅ AI Hand Tracking Aktif (60 FPS)";
                    camStatusText.style.color = "#4ade80";
                    this.showFeedbackBadge("📷 Kamera AI Aktif! Gerakkan tangan Anda");
                } else {
                    startCamBtn.innerText = "📷 Buka Kamera";
                    camStatusText.innerText = "⚠️ Kamera tidak diizinkan. Mode Mouse/Touch aktif.";
                    camStatusText.style.color = "#f87171";
                    alert("Kamera tidak dapat diakses atau diblokir peramban. Anda tetap bisa menggerakkan wayang menggunakan Mouse atau Touchscreen!");
                }
                startCamBtn.disabled = false;
            });
        }

        // Fullscreen Projector Mode
        const fsBtn = document.getElementById('fullscreenBtn');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Gamelan Toggle Button
        const gamelanBtn = document.getElementById('gamelanToggleBtn');
        if (gamelanBtn) {
            gamelanBtn.addEventListener('click', () => {
                const playing = this.soundEngine.toggleGamelan();
                this.updateGamelanBtnState(playing);
            });
        }

        // Kepyak Button
        const kepyakBtn = document.getElementById('kepyakBtn');
        if (kepyakBtn) {
            kepyakBtn.addEventListener('click', () => {
                this.soundEngine.playKepyak(1.0);
                this.triggerScreenShake(3);
            });
        }

        // Cempala Button
        const cempalaBtn = document.getElementById('cempalaBtn');
        if (cempalaBtn) {
            cempalaBtn.addEventListener('click', () => {
                this.soundEngine.playCempala(1.0);
                this.triggerScreenShake(4);
            });
        }

        // Gong Button
        const gongBtn = document.getElementById('gongBtn');
        if (gongBtn) {
            gongBtn.addEventListener('click', () => {
                this.soundEngine.playGong(1.0);
                this.showFeedbackBadge("🎶 GOOOOONG...");
            });
        }

        // Character Selectors
        const leftSelect = document.getElementById('puppetLeftSelect');
        if (leftSelect) {
            leftSelect.addEventListener('change', (e) => {
                this.puppetLeft.setCharacter(e.target.value);
                this.showFeedbackBadge(`Tokoh Kiri: ${this.puppetLeft.character.name}`);
            });
        }

        const rightSelect = document.getElementById('puppetRightSelect');
        if (rightSelect) {
            rightSelect.addEventListener('change', (e) => {
                this.puppetRight.setCharacter(e.target.value);
                this.showFeedbackBadge(`Tokoh Kanan: ${this.puppetRight.character.name}`);
            });
        }

        // Scene Selector
        const sceneSelect = document.getElementById('sceneSelect');
        if (sceneSelect) {
            sceneSelect.addEventListener('change', (e) => {
                this.selectScene(e.target.value);
            });
        }

        // Control Mode Selector (Dual vs Solo)
        const controlModeSelect = document.getElementById('controlModeSelect');
        if (controlModeSelect) {
            controlModeSelect.addEventListener('change', (e) => {
                this.controlMode = e.target.value;
                this.showFeedbackBadge(`Mode Kontrol: ${this.controlMode === 'dual' ? 'Dual Dalang (2 Wayang)' : 'Solo Dalang (1 Wayang Detail)'}`);
            });
        }

        // Toggle HUD button
        const toggleHudBtn = document.getElementById('toggleHudBtn');
        if (toggleHudBtn) {
            toggleHudBtn.addEventListener('click', () => this.toggleHud());
        }
    }

    selectScene(sceneId) {
        this.sceneManager.setScene(sceneId);
        const scene = SCENE_PRESETS[sceneId];
        if (scene) {
            this.showFeedbackBadge(`🎭 Babak: ${scene.name}`);
            const sel = document.getElementById('sceneSelect');
            if (sel) sel.value = sceneId;
        }
    }

    updateGamelanBtnState(isPlaying) {
        const btn = document.getElementById('gamelanToggleBtn');
        if (btn) {
            btn.classList.toggle('active', isPlaying);
            btn.innerHTML = isPlaying ? "🎵 Gamelan: ON" : "🔇 Gamelan: OFF";
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.warn(err));
            this.showFeedbackBadge("📽️ Mode Proyektor Layar Penuh (Tekan ESC / F untuk keluar)");
        } else {
            document.exitFullscreen().catch(err => console.warn(err));
        }
    }

    toggleHud() {
        this.isHudVisible = !this.isHudVisible;
        const hud = document.getElementById('dalangHud');
        const hudBtn = document.getElementById('toggleHudBtn');
        if (hud) {
            hud.classList.toggle('hidden', !this.isHudVisible);
        }
        if (hudBtn) {
            hudBtn.innerText = this.isHudVisible ? "👁️ Sembunyikan Menu" : "⚙️ Buka Menu Dalang (H)";
        }
    }

    showFeedbackBadge(text) {
        const badge = document.getElementById('actionBadge');
        if (!badge) return;
        badge.innerText = text;
        badge.classList.remove('show');
        void badge.offsetWidth; // Trigger reflow
        badge.classList.add('show');
    }
}

// Inisialisasi saat DOM siap
window.addEventListener('DOMContentLoaded', () => {
    window.wayangApp = new WayangDigitalApp();
});
