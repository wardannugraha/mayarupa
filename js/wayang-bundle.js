/* ==========================================================================
   MAYARUPA - VIRTUAL HAND-TRACKED PUPPETRY
   Author: wardannugraha • © 2026 wardannugraha
   Fitur: AI Hand Tracking, Auto-Load Katalog JSON, Pengaturan Ukuran Per-Tokoh,
   Rotasi Sinkron, Out-Frame, dan Dual-Screen Layar Bersih Proyektor / OBS
   ========================================================================== */

(function () {
    'use strict';

    /* ==========================================================================
       1. SOUND ENGINE TRADISIONAL (ALUNAN GAMELAN SLENDRO BAWAAN)
       ========================================================================== */
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.ambientGain = null;

            this.slendroFreqs = [278.4, 316.2, 359.8, 418.6, 482.0, 556.8];
            this.isAmbientPlaying = false;
            this.ambientTimer = null;
        }

        init() {
            if (this.ctx) return;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();

                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.85;
                this.masterGain.connect(this.ctx.destination);

                this.ambientGain = this.ctx.createGain();
                this.ambientGain.gain.value = 0.35;
                this.ambientGain.connect(this.masterGain);
            } catch (e) {
                console.warn("Web Audio API belum aktif:", e);
            }
        }

        resumeAudio() {
            if (!this.ctx) this.init();
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playGong() {
            this.resumeAudio();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(68, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.7, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

            osc.connect(gain);
            gain.connect(this.ambientGain);

            osc.start(now);
            osc.stop(now + 4.6);
        }

        toggleAmbient() {
            if (this.isAmbientPlaying) {
                this.stopAmbient();
                return false;
            } else {
                this.startAmbient();
                return true;
            }
        }

        startAmbient() {
            this.resumeAudio();
            if (this.isAmbientPlaying) return;
            this.isAmbientPlaying = true;

            let step = 0;
            const melody = [0, 2, 1, 3, 4, 3, 1, 0];

            this.ambientTimer = setInterval(() => {
                if (!this.isAmbientPlaying || !this.ctx) return;

                const note = melody[step % melody.length];
                const freq = this.slendroFreqs[note];
                const now = this.ctx.currentTime;

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

                osc.connect(gain);
                gain.connect(this.ambientGain);

                osc.start(now);
                osc.stop(now + 2.3);

                if (step % 8 === 7) {
                    this.playGong();
                }

                step++;
            }, 1800);
        }

        stopAmbient() {
            this.isAmbientPlaying = false;
            if (this.ambientTimer) {
                clearInterval(this.ambientTimer);
                this.ambientTimer = null;
            }
        }
    }

    /* ==========================================================================
       2. DATABASE KARAKTER FOTO WAYANG & IMAGE LOADER
       ========================================================================== */
    const DEFAULT_CATALOG = {
        'wayang1': {
            id: 'wayang1',
            name: 'Ksatria (Wayang 1)',
            src: 'assets/wayang/Wayang 1.png',
            heightRatio: 0.68,
            scaleMultiplier: 1.0,
            offsetY: 0,
            baseFacing: 1
        },
        'semar': {
            id: 'semar',
            name: 'Kyai Lurah Semar',
            src: 'assets/wayang/Semar.png',
            heightRatio: 0.52,
            scaleMultiplier: 1.0,
            offsetY: 0,
            baseFacing: 1
        },
        'petruk': {
            id: 'petruk',
            name: 'Petruk / Punakawan',
            src: 'assets/wayang/Petruk.png',
            heightRatio: 0.58,
            scaleMultiplier: 1.0,
            offsetY: 0,
            baseFacing: 1
        },
        'gunungan': {
            id: 'gunungan',
            name: 'Gunungan (Kayon)',
            src: 'assets/wayang/Gunungan.png',
            heightRatio: 0.76,
            scaleMultiplier: 1.0,
            offsetY: 0,
            baseFacing: 1
        }
    };

    let WAYANG_CATALOG = JSON.parse(JSON.stringify(DEFAULT_CATALOG));
    const loadedImages = {};

    function loadWayangImage(id, src) {
        if (loadedImages[id]) return Promise.resolve(loadedImages[id]);
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                loadedImages[id] = img;
                resolve(img);
            };
            img.onerror = () => {
                // Fallback pencarian path alternatif antara assets/wayang dan FotoWayang
                let altSrc = null;
                if (src.startsWith('FotoWayang/')) {
                    altSrc = src.replace('FotoWayang/', 'assets/wayang/');
                } else if (src.startsWith('assets/wayang/')) {
                    altSrc = src.replace('assets/wayang/', 'FotoWayang/');
                } else if (!src.includes('/')) {
                    altSrc = `assets/wayang/${src}`;
                }

                if (altSrc && altSrc !== src) {
                    const fallbackImg = new Image();
                    fallbackImg.onload = () => {
                        loadedImages[id] = fallbackImg;
                        resolve(fallbackImg);
                    };
                    fallbackImg.onerror = () => {
                        console.warn(`Gagal memuat gambar dari kedua path: ${src} & ${altSrc}`);
                        resolve(null);
                    };
                    fallbackImg.src = altSrc;
                } else {
                    resolve(null);
                }
            };
            img.src = src;
        });
    }

    // Muat konfigurasi per-karakter dari LocalStorage jika ada
    function applySavedSettings() {
        try {
            const savedSettings = localStorage.getItem('wayang_character_settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                Object.keys(parsed).forEach(k => {
                    if (WAYANG_CATALOG[k]) {
                        WAYANG_CATALOG[k].scaleMultiplier = parsed[k].scaleMultiplier ?? 1.0;
                        WAYANG_CATALOG[k].offsetY = parsed[k].offsetY ?? 0;
                    }
                });
            }
        } catch (e) {
            console.warn("Gagal membaca LocalStorage:", e);
        }
    }

    function saveCatalogSettings() {
        try {
            const toSave = {};
            Object.keys(WAYANG_CATALOG).forEach(k => {
                toSave[k] = {
                    id: WAYANG_CATALOG[k].id,
                    name: WAYANG_CATALOG[k].name,
                    src: WAYANG_CATALOG[k].src,
                    heightRatio: WAYANG_CATALOG[k].heightRatio,
                    scaleMultiplier: WAYANG_CATALOG[k].scaleMultiplier,
                    offsetY: WAYANG_CATALOG[k].offsetY
                };
            });
            localStorage.setItem('wayang_character_settings', JSON.stringify(toSave));
        } catch (e) {
            console.warn("Gagal menyimpan ke LocalStorage:", e);
        }
    }

    // Preload default images
    Object.values(WAYANG_CATALOG).forEach(c => loadWayangImage(c.id, c.src));
    applySavedSettings();

    /* ==========================================================================
       3. PUPPET RIG
       ========================================================================== */
    class PuppetRig {
        constructor(id, characterId = 'wayang1', initialX = 350, initialY = 500, defaultFacing = 1) {
            this.id = id;
            this.characterId = characterId;
            this.facing = defaultFacing;
            this.baseInvert = 1;
            this.isSilhouette = true;

            this.x = initialX;
            this.y = initialY;
            this.targetX = initialX;
            this.targetY = initialY;

            this.vx = 0;
            this.vy = 0;
            this.swayAngle = 0;
            this.targetTilt = 0;
            this.breathTime = Math.random() * 10;
            this.customImage = null;
            this.isVisible = true;

            this.lastFlipTime = 0;
        }

        setCharacter(charId, customImg = null) {
            this.characterId = charId;
            this.customImage = customImg;
        }

        getSettings() {
            const charData = WAYANG_CATALOG[this.characterId] || { scaleMultiplier: 1.0, offsetY: 0 };
            return {
                scaleMultiplier: charData.scaleMultiplier || 1.0,
                offsetY: charData.offsetY || 0
            };
        }

        flipFacing() {
            this.baseInvert *= -1;
            this.facing *= -1;
        }

        toggleSilhouette() {
            this.isSilhouette = !this.isSilhouette;
            return this.isSilhouette;
        }

        applyHandPose(handData) {
            if (!handData || !handData.rawLandmarks) return;

            const lm = handData.rawLandmarks;
            const wrist = lm[0];
            const thumbTip = lm[4];
            const pinkyTip = lm[20];
            const middleTip = lm[12];

            // 1. Rotasi Kemiringan Tangan (Screen-Space Mirrored)
            const dxAngle = (wrist.x - middleTip.x);
            const dyAngle = (middleTip.y - wrist.y);

            let rawAngle = Math.atan2(dxAngle, -dyAngle);
            const clampedTilt = Math.max(-0.65, Math.min(0.65, rawAngle * 0.75));
            this.targetTilt = clampedTilt;

            // 2. Deteksi Pembalikan Telapak Tangan
            const now = performance.now();
            if (now - this.lastFlipTime < 280) return;

            const thumbX = (1.0 - thumbTip.x);
            const pinkyX = (1.0 - pinkyTip.x);
            const diffX = thumbX - pinkyX;

            let detectedFacing = this.facing;

            if (this.id === 'kanan') {
                if (diffX < -0.04) {
                    detectedFacing = -1 * this.baseInvert;
                } else if (diffX > 0.04) {
                    detectedFacing = 1 * this.baseInvert;
                }
            } else {
                if (diffX > 0.04) {
                    detectedFacing = 1 * this.baseInvert;
                } else if (diffX < -0.04) {
                    detectedFacing = -1 * this.baseInvert;
                }
            }

            if (detectedFacing !== this.facing) {
                this.facing = detectedFacing;
                this.lastFlipTime = now;
            }
        }

        update(dt = 0.016) {
            const lerpFactor = 0.18;
            const prevX = this.x;
            const prevY = this.y;

            this.x += (this.targetX - this.x) * lerpFactor;
            this.y += (this.targetY - this.y) * lerpFactor;

            this.vx = this.x - prevX;
            this.vy = this.y - prevY;

            const movementSway = (this.vx * 0.015);
            const finalTargetRotation = movementSway + this.targetTilt;
            this.swayAngle += (finalTargetRotation - this.swayAngle) * 0.14;

            this.breathTime += dt * 1.8;
        }

        draw(ctx, screenHeight) {
            if (!this.isVisible) return;

            const img = this.customImage || loadedImages[this.characterId];
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const charData = WAYANG_CATALOG[this.characterId] || { heightRatio: 0.65, scaleMultiplier: 1.0, offsetY: 0 };
            const scaleMult = charData.scaleMultiplier ?? 1.0;
            const offY = charData.offsetY ?? 0;

            const targetHeight = screenHeight * charData.heightRatio * scaleMult;
            const aspect = img.naturalWidth / img.naturalHeight;
            const targetWidth = targetHeight * aspect;

            ctx.save();

            const bobbingY = Math.sin(this.breathTime) * 2.5;
            ctx.translate(this.x, this.y + offY + bobbingY);
            ctx.rotate(this.swayAngle);

            ctx.scale(this.facing, 1);

            const drawX = -targetWidth / 2;
            const drawY = -targetHeight;

            if (this.isSilhouette) {
                ctx.save();
                ctx.shadowColor = 'rgba(10, 6, 2, 0.92)';
                ctx.shadowBlur = 6;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;

                ctx.filter = 'brightness(0%) contrast(160%)';
                ctx.drawImage(img, drawX, drawY, targetWidth, targetHeight);
                ctx.restore();
            } else {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 4;

                ctx.drawImage(img, drawX, drawY, targetWidth, targetHeight);
                ctx.restore();
            }

            ctx.restore();
        }

        getSyncData(screenWidth, screenHeight) {
            const charData = WAYANG_CATALOG[this.characterId] || { heightRatio: 0.65, scaleMultiplier: 1.0, offsetY: 0, src: '' };
            return {
                visible: this.isVisible,
                src: this.customImage ? this.customImage.src : charData.src,
                heightRatio: charData.heightRatio,
                sizeMultiplier: charData.scaleMultiplier ?? 1.0,
                relX: this.x / screenWidth,
                relY: this.y / screenHeight,
                offsetY: charData.offsetY ?? 0,
                rotation: this.swayAngle,
                facing: this.facing,
                isSilhouette: this.isSilhouette
            };
        }
    }

    /* ==========================================================================
       4. SCENE & ATMOSFER LATAR (WARM CINEMATIC GOLD & MULTI-MOTIF TRADISIONAL)
       ========================================================================== */
    const MOTIF_PRESETS = {
        'megamendung_batik': {
            id: 'megamendung_batik',
            name: 'Mega Mendung (Batik Bergerak)',
            type: 'megamendung_batik'
        },
        'awan_kumulus': {
            id: 'awan_kumulus',
            name: 'Awan Kumulus Tradisional',
            type: 'clouds'
        },
        'ombak_tirta': {
            id: 'ombak_tirta',
            name: 'Ombak Tirta Samudera',
            type: 'waves'
        },
        'candi_gunung': {
            id: 'candi_gunung',
            name: 'Siluet Candi & Gunung',
            type: 'mountains'
        },
        'hutan_alas': {
            id: 'hutan_alas',
            name: 'Hutan Wanayasa (Alas)',
            type: 'forest'
        },
        'kelir_polos': {
            id: 'kelir_polos',
            name: 'Kelir Polos (Blencong Murni)',
            type: 'none'
        }
    };

    class SceneManager {
        constructor(canvasElement) {
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            this.currentMotif = MOTIF_PRESETS.megamendung_batik;

            this.blencongFlicker = 1.0;
            this.time = 0;
            this.cloudOffset = 0;

            // ElementBg / Assets Background Mega Mendung Batik Asset
            this.megaMendungImg = new Image();
            this.megaMendungImg.onerror = () => {
                // Fallback ke path legacy ElementBg jika assets/background belum dibuat
                if (this.megaMendungImg.src.includes('assets/background/')) {
                    this.megaMendungImg.src = 'ElementBg/pngtree-batik-mega-cloudy-blue-illustration-vector-png-image_7481784.png';
                }
            };
            this.megaMendungImg.src = 'assets/background/mega_mendung.png';
            // Jika belum ada file di assets/background, langsung fallback ke ElementBg
            setTimeout(() => {
                if (!this.megaMendungImg.complete || this.megaMendungImg.naturalWidth === 0) {
                    this.megaMendungImg.src = 'ElementBg/pngtree-batik-mega-cloudy-blue-illustration-vector-png-image_7481784.png';
                }
            }, 500);

            this.megaMendungSilhouetteCanvas = null;
        }

        setLatar(motifId) {
            if (MOTIF_PRESETS[motifId]) {
                this.currentMotif = MOTIF_PRESETS[motifId];
            }
        }

        getSilhouettedCloudCanvas() {
            if (this.megaMendungSilhouetteCanvas) return this.megaMendungSilhouetteCanvas;
            const img = this.megaMendungImg;
            if (!img || !img.complete || img.naturalWidth === 0) return null;

            const off = document.createElement('canvas');
            off.width = img.naturalWidth;
            off.height = img.naturalHeight;
            const octx = off.getContext('2d');
            octx.drawImage(img, 0, 0);
            octx.globalCompositeOperation = 'source-in';
            octx.fillStyle = '#160904';
            octx.fillRect(0, 0, off.width, off.height);

            this.megaMendungSilhouetteCanvas = off;
            return off;
        }

        update(dt = 0.016) {
            this.time += dt * 3.5;
            this.blencongFlicker = 1.0 + Math.sin(this.time) * 0.03 + (Math.random() - 0.5) * 0.018;
            this.cloudOffset += dt * 6.0;
        }

        draw(width, height) {
            const ctx = this.ctx;

            // 1. Dasar Kain Kelir Candi Keemasan Sinematik (Warm Cinematic Gold)
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#4a2418'); // Candi keemasan atas
            grad.addColorStop(0.55, '#a66e35'); // Pendar tengah kelir
            grad.addColorStop(0.85, '#5c3314'); // Dasar hangat
            grad.addColorStop(1.0, '#1c0d06'); // Bayangan bawah
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // 2. Cahaya Pendar Blencong Melingkar
            const centerX = width * 0.5;
            const centerY = height * 0.32;
            const radius = Math.max(width, height) * 0.78 * this.blencongFlicker;

            const lightGrad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, radius);
            lightGrad.addColorStop(0, 'rgba(255, 220, 140, 0.95)');
            lightGrad.addColorStop(0.3, 'rgba(255, 195, 100, 0.55)');
            lightGrad.addColorStop(0.65, 'rgba(180, 95, 30, 0.25)');
            lightGrad.addColorStop(1.0, 'rgba(22, 10, 4, 0.85)');

            ctx.fillStyle = lightGrad;
            ctx.fillRect(0, 0, width, height);

            // 3. Tekstur Halus Serat Kain Kelir
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.015)';
            ctx.lineWidth = 1;
            for (let x = 0; x < width; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // 4. Render Siluet Motif Terpilih di Bagian Bawah
            this.drawSelectedMotif(ctx, width, height);
        }

        drawSelectedMotif(ctx, width, height) {
            const motif = this.currentMotif.type;
            if (motif === 'none') return;

            ctx.save();
            const baseY = height * 0.82;

            if (motif === 'megamendung_batik') {
                // MOTIF 1: Siluet Mega Mendung Batik (ElementBg Bertingkat & Bergerak Dinamis)
                this.renderMegaMendungBatik(ctx, width, height, baseY);

            } else if (motif === 'clouds') {
                // MOTIF 2: Awan Kumulus Tradisional
                ctx.fillStyle = 'rgba(38, 20, 10, 0.32)';
                this.renderRollingClouds(ctx, width, height, baseY - 35, 90, this.cloudOffset * 0.35, 24);

                ctx.fillStyle = 'rgba(28, 14, 7, 0.6)';
                this.renderRollingClouds(ctx, width, height, baseY - 15, 75, -this.cloudOffset * 0.5, 30);

                ctx.fillStyle = 'rgba(14, 7, 3, 0.92)';
                this.renderRollingClouds(ctx, width, height, baseY + 6, 60, this.cloudOffset * 0.65, 36);

            } else if (motif === 'waves') {
                // MOTIF 3: Ombak Tirta Samudera
                ctx.fillStyle = 'rgba(35, 18, 9, 0.35)';
                this.renderTirtaWaves(ctx, width, height, baseY - 30, 80, this.cloudOffset * 0.8, 22);

                ctx.fillStyle = 'rgba(25, 12, 6, 0.65)';
                this.renderTirtaWaves(ctx, width, height, baseY - 10, 65, -this.cloudOffset * 1.0, 28);

                ctx.fillStyle = 'rgba(12, 6, 2, 0.94)';
                this.renderTirtaWaves(ctx, width, height, baseY + 8, 50, this.cloudOffset * 1.2, 34);

            } else if (motif === 'mountains') {
                // MOTIF 4: Siluet Candi & Gunung Mahameru
                ctx.fillStyle = 'rgba(40, 22, 11, 0.45)';
                this.renderTemplePeaks(ctx, width, height, baseY - 60, 220, 0);

                ctx.fillStyle = 'rgba(15, 7, 3, 0.95)';
                this.renderTemplePeaks(ctx, width, height, baseY - 15, 160, 80);

            } else if (motif === 'forest') {
                // MOTIF 5: Hutan Wanayasa / Alas Pohon Hayat
                ctx.fillStyle = 'rgba(38, 20, 10, 0.4)';
                this.renderForestSilhouettes(ctx, width, height, baseY - 40, 130, 0);

                ctx.fillStyle = 'rgba(14, 7, 3, 0.92)';
                this.renderForestSilhouettes(ctx, width, height, baseY - 10, 100, 50);
            }

            // Kabut Emas Hangat (Atmospheric Golden Mist)
            const mistGrad = ctx.createLinearGradient(0, baseY - 50, 0, height);
            mistGrad.addColorStop(0, 'rgba(255, 225, 160, 0)');
            mistGrad.addColorStop(0.5, 'rgba(240, 185, 110, 0.14)');
            mistGrad.addColorStop(1.0, 'rgba(12, 6, 2, 0.65)');
            ctx.fillStyle = mistGrad;
            ctx.fillRect(0, baseY - 50, width, height - baseY + 50);

            ctx.restore();
        }

        /**
         * 1. Mega Mendung Batik (ElementBg Berulang & Bergerak Halus Bebas Glitch)
         */
        renderMegaMendungBatik(ctx, width, height, baseY) {
            const cloudCanvas = this.getSilhouettedCloudCanvas();
            const img = cloudCanvas || this.megaMendungImg;

            if (!img || !img.width || img.width === 0) {
                ctx.fillStyle = 'rgba(14, 7, 3, 0.92)';
                this.renderRollingClouds(ctx, width, height, baseY, 80, this.cloudOffset * 0.5, 30);
                return;
            }

            const imgRatio = (img.height || 1) / (img.width || 1);

            // Layer 1: Latar Belakang (Nuansa Halus, Gerak Tenang ke Kanan)
            const w1 = Math.max(240, width * 0.28);
            const h1 = w1 * imgRatio;
            const step1 = w1 * 0.58;
            const pos1 = this.cloudOffset * 10;
            const shift1 = ((pos1 % step1) + step1) % step1;

            ctx.globalAlpha = 0.42;
            for (let x = -step1 * 2; x <= width + step1 * 2; x += step1) {
                ctx.drawImage(img, x + shift1, baseY - h1 * 0.65, w1, h1);
            }

            // Layer 2: Latar Tengah (Bertumpuk di Sela, Gerak Tenang ke Kiri)
            const w2 = Math.max(280, width * 0.34);
            const h2 = w2 * imgRatio;
            const step2 = w2 * 0.62;
            const pos2 = -this.cloudOffset * 14;
            const shift2 = ((pos2 % step2) + step2) % step2;

            ctx.globalAlpha = 0.72;
            for (let x = -step2 * 2; x <= width + step2 * 2; x += step2) {
                ctx.drawImage(img, x + shift2, baseY - h2 * 0.42, w2, h2);
            }

            // Layer 3: Latar Depan (Siluet Pekat, Gerak Mantap ke Kanan)
            const w3 = Math.max(330, width * 0.40);
            const h3 = w3 * imgRatio;
            const step3 = w3 * 0.68;
            const pos3 = this.cloudOffset * 18;
            const shift3 = ((pos3 % step3) + step3) % step3;

            ctx.globalAlpha = 0.96;
            for (let x = -step3 * 2; x <= width + step3 * 2; x += step3) {
                ctx.drawImage(img, x + shift3, baseY - h3 * 0.18, w3, h3);
            }

            ctx.globalAlpha = 1.0;

            // Dasar Padat Rapi di Bawah Awan
            ctx.fillStyle = '#160904';
            ctx.fillRect(0, baseY + h3 * 0.68, width, height - (baseY + h3 * 0.68));
        }

        /**
         * 1. Awan Mega Mendung (Gumpalan Lembut Alami)
         */
        renderRollingClouds(ctx, width, height, y, waveWidth, offset, amp) {
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(0, y);

            for (let x = -waveWidth * 2; x <= width + waveWidth * 2; x += waveWidth) {
                const drawX = x + (offset % waveWidth);
                ctx.bezierCurveTo(
                    drawX + waveWidth * 0.25, y - amp,
                    drawX + waveWidth * 0.75, y - amp,
                    drawX + waveWidth, y
                );
            }

            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        }

        /**
         * 2. Ombak Tirta Samudera (Gelombang Runcing Wayang)
         */
        renderTirtaWaves(ctx, width, height, y, waveWidth, offset, amp) {
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(0, y);

            for (let x = -waveWidth * 2; x <= width + waveWidth * 2; x += waveWidth) {
                const drawX = x + (offset % waveWidth);
                ctx.quadraticCurveTo(
                    drawX + waveWidth * 0.4, y - amp * 1.3,
                    drawX + waveWidth * 0.7, y - amp * 0.2
                );
                ctx.quadraticCurveTo(
                    drawX + waveWidth * 0.85, y - amp * 0.8,
                    drawX + waveWidth, y
                );
            }

            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        }

        /**
         * 3. Siluet Candi & Gunung
         */
        renderTemplePeaks(ctx, width, height, y, stepWidth, shiftX) {
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(0, y);

            for (let x = -stepWidth; x <= width + stepWidth; x += stepWidth) {
                const px = x + shiftX;
                // Puncak Candi & Gunung bertingkat
                ctx.lineTo(px + stepWidth * 0.2, y - 20);
                ctx.lineTo(px + stepWidth * 0.35, y - 50);
                ctx.lineTo(px + stepWidth * 0.5, y - 85); // Puncak
                ctx.lineTo(px + stepWidth * 0.65, y - 50);
                ctx.lineTo(px + stepWidth * 0.8, y - 20);
                ctx.lineTo(px + stepWidth, y);
            }

            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        }

        /**
         * 4. Siluet Hutan Alas
         */
        renderForestSilhouettes(ctx, width, height, y, stepWidth, shiftX) {
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.lineTo(0, y);

            for (let x = -stepWidth; x <= width + stepWidth; x += stepWidth) {
                const px = x + shiftX;
                ctx.bezierCurveTo(
                    px + stepWidth * 0.2, y - 35,
                    px + stepWidth * 0.35, y - 60,
                    px + stepWidth * 0.5, y - 45
                );
                ctx.bezierCurveTo(
                    px + stepWidth * 0.65, y - 70,
                    px + stepWidth * 0.85, y - 30,
                    px + stepWidth, y
                );
            }

            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        }
    }

    /* ==========================================================================
       5. HAND TRACKER AI
       ========================================================================== */
    class HandTracker {
        constructor(videoElement, canvasDebugElement, onHandsDetectedCallback) {
            this.video = videoElement;
            this.debugCanvas = canvasDebugElement;
            this.debugCtx = canvasDebugElement ? canvasDebugElement.getContext('2d') : null;
            this.onHandsDetected = onHandsDetectedCallback;

            this.hands = null;
            this.camera = null;
            this.isRunning = false;
            this.isMirrored = true;
            this.smoothedLeft = null;
            this.smoothedRight = null;
        }

        async init() {
            if (typeof window.Hands === 'undefined') {
                await this.waitForMediaPipe();
            }

            try {
                this.hands = new window.Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                });

                this.hands.setOptions({
                    maxNumHands: 2,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                this.hands.onResults((results) => this.processResults(results));
                return true;
            } catch (err) {
                console.error("Gagal inisialisasi MediaPipe Hands:", err);
                return false;
            }
        }

        waitForMediaPipe() {
            return new Promise((resolve) => {
                const check = setInterval(() => {
                    if (typeof window.Hands !== 'undefined') {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(check);
                    resolve();
                }, 4000);
            });
        }

        async startCamera() {
            if (this.isRunning) return true;

            // Pastikan model MediaPipe Hands sudah siap
            if (!this.hands) {
                await this.init();
            }

            // 1. Jika stream kamera sudah pernah diizinkan sebelumnya, cukup aktifkan kembali jalurnya (Tanpa Popup Izin!)
            if (this.mediaStream && this.mediaStream.active) {
                this.mediaStream.getVideoTracks().forEach(track => {
                    track.enabled = true;
                });
                try {
                    await this.video.play();
                    this.isRunning = true;
                    return true;
                } catch (e) {
                    console.warn("Melanjutkan video stream:", e);
                }
            }

            // 2. Jika pertama kali dibuka, minta izin kamera sekali saja
            const permModal = document.getElementById('cameraPermModal');
            if (permModal) permModal.classList.add('active');

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    },
                    audio: false
                });

                this.mediaStream = stream;
                this.video.srcObject = stream;

                if (permModal) permModal.classList.remove('active');

                await new Promise((res) => {
                    this.video.onloadedmetadata = () => {
                        this.video.play().then(res).catch(res);
                    };
                });

                if (typeof window.Camera !== 'undefined') {
                    this.camera = new window.Camera(this.video, {
                        onFrame: async () => {
                            if (this.hands && this.isRunning && this.video.readyState >= 2) {
                                try {
                                    await this.hands.send({ image: this.video });
                                } catch (err) {
                                    console.warn("MediaPipe frame send error:", err);
                                }
                            }
                        },
                        width: 640,
                        height: 480
                    });
                    this.camera.start();
                } else {
                    this.runManualFrameLoop();
                }

                this.isRunning = true;
                return true;
            } catch (error) {
                if (permModal) permModal.classList.remove('active');
                console.error("Error webcam:", error);
                return false;
            }
        }

        stopCamera() {
            this.isRunning = false;
            // Alih-alih memutus total, kita cukup menonaktifkan track (menjaga izin tetap tersimpan)
            if (this.mediaStream) {
                this.mediaStream.getVideoTracks().forEach(track => {
                    track.enabled = false;
                });
            }
            if (this.video) {
                this.video.pause();
            }
            if (this.debugCtx && this.debugCanvas) {
                this.debugCtx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
            }
        }

        runManualFrameLoop() {
            const loop = async () => {
                if (!this.isRunning) return;
                if (this.video.readyState >= 2 && this.hands) {
                    await this.hands.send({ image: this.video });
                }
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        }

        processResults(results) {
            if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
                if (this.onHandsDetected) {
                    this.onHandsDetected({ leftHand: null, rightHand: null });
                }
                this.renderDebug(null);
                return;
            }

            const rawHands = [];

            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const lm = results.multiHandLandmarks[i];
                const wrist = lm[0];
                const screenX = this.isMirrored ? (1.0 - wrist.x) : wrist.x;
                const screenY = wrist.y;

                rawHands.push({
                    screenX: screenX,
                    screenY: screenY,
                    rawLandmarks: lm
                });
            }

            rawHands.sort((a, b) => a.screenX - b.screenX);

            let leftHandData = null;
            let rightHandData = null;
            let singleHandData = null;

            const alpha = 0.38;

            if (rawHands.length === 1) {
                const raw = rawHands[0];
                if (!this.smoothedSingle) {
                    this.smoothedSingle = { x: raw.screenX, y: raw.screenY, rawLandmarks: raw.rawLandmarks };
                } else {
                    this.smoothedSingle.x = this.smoothedSingle.x * (1 - alpha) + raw.screenX * alpha;
                    this.smoothedSingle.y = this.smoothedSingle.y * (1 - alpha) + raw.screenY * alpha;
                    this.smoothedSingle.rawLandmarks = raw.rawLandmarks;
                }
                singleHandData = this.smoothedSingle;

                if (raw.screenX < 0.5) {
                    leftHandData = this.smoothedSingle;
                } else {
                    rightHandData = this.smoothedSingle;
                }
            } else if (rawHands.length >= 2) {
                const rawL = rawHands[0];
                const rawR = rawHands[1];

                if (!this.smoothedLeft) {
                    this.smoothedLeft = { x: rawL.screenX, y: rawL.screenY, rawLandmarks: rawL.rawLandmarks };
                } else {
                    this.smoothedLeft.x = this.smoothedLeft.x * (1 - alpha) + rawL.screenX * alpha;
                    this.smoothedLeft.y = this.smoothedLeft.y * (1 - alpha) + rawL.screenY * alpha;
                    this.smoothedLeft.rawLandmarks = rawL.rawLandmarks;
                }

                if (!this.smoothedRight) {
                    this.smoothedRight = { x: rawR.screenX, y: rawR.screenY, rawLandmarks: rawR.rawLandmarks };
                } else {
                    this.smoothedRight.x = this.smoothedRight.x * (1 - alpha) + rawR.screenX * alpha;
                    this.smoothedRight.y = this.smoothedRight.y * (1 - alpha) + rawR.screenY * alpha;
                    this.smoothedRight.rawLandmarks = rawR.rawLandmarks;
                }

                leftHandData = this.smoothedLeft;
                rightHandData = this.smoothedRight;
                singleHandData = this.smoothedLeft;
            }

            if (this.onHandsDetected) {
                this.onHandsDetected({
                    leftHand: leftHandData,
                    rightHand: rightHandData,
                    singleHand: singleHandData
                });
            }

            this.renderDebug(results);
        }

        renderDebug(results) {
            if (!this.debugCtx) return;
            const ctx = this.debugCtx;
            const w = this.debugCanvas.width;
            const h = this.debugCanvas.height;

            ctx.clearRect(0, 0, w, h);
            if (!results || !results.multiHandLandmarks) return;

            results.multiHandLandmarks.forEach((landmarks, idx) => {
                ctx.strokeStyle = idx === 0 ? '#ffd700' : '#00e5ff';
                ctx.lineWidth = 2;

                landmarks.forEach((p) => {
                    const px = this.isMirrored ? (1 - p.x) * w : p.x * w;
                    const py = p.y * h;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        }
    }

    /* ==========================================================================
       6. WAYANG DIGITAL APP CONTROLLER & DUAL SCREEN SYNC
       ========================================================================== */
    class WayangDigitalApp {
        constructor() {
            this.canvas = document.getElementById('kelirCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.video = document.getElementById('webcamVideo');
            this.debugCanvas = document.getElementById('debugHandCanvas');

            this.soundEngine = new SoundEngine();
            this.sceneManager = new SceneManager(this.canvas);

            // Inisialisasi Wayang Kiri & Kanan
            this.puppetLeft = new PuppetRig('kiri', 'wayang1', 350, 520, 1);
            this.puppetRight = new PuppetRig('kanan', 'semar', 850, 520, -1);

            this.handTracker = new HandTracker(
                this.video,
                this.debugCanvas,
                (hands) => this.handleHandsDetected(hands)
            );

            this.mouseDrag = {
                active: false,
                puppet: null
            };

            this.syncChannel = new BroadcastChannel('wayang_digital_channel');
            this.proyektorWindow = null;

            this.lastTime = performance.now();
            this.isHudVisible = true;
            this.isGlobalSilhouette = true;
            this.handMode = 'dual'; // 'dual' atau 'single'

            this.selectedCharacterToEdit = 'wayang1';

            this.init();
        }

        async init() {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // Muat katalog wayang JSON dari FotoWayang/ jika tersedia
            await this.loadCatalogJSON();

            this.setupUIEvents();
            this.setupKeyboardShortcuts();
            this.setupMouseEvents();

            this.handTracker.init();

            requestAnimationFrame((t) => this.renderLoop(t));
        }

        /**
         * Membaca katalog_wayang.json secara dinamis
         */
        async loadCatalogJSON() {
            try {
                const res = await fetch('katalog_wayang.json');
                if (!res.ok) return;
                const items = await res.json();

                if (Array.isArray(items) && items.length > 0) {
                    items.forEach((item) => {
                        let id, name, file, heightRatio;
                        if (typeof item === 'string') {
                            file = item;
                            name = file.replace(/\.[^/.]+$/, "");
                            id = null;
                            heightRatio = 0.65;
                        } else {
                            file = item.file || item.src;
                            name = item.name || file.replace(/\.[^/.]+$/, "");
                            id = item.id;
                            heightRatio = item.heightRatio || 0.65;
                        }

                        // Pencocokan ID ketat agar tidak menduplikasi karakter bawaan
                        if (!id) {
                            const fLower = file.toLowerCase();
                            const nLower = name.toLowerCase();
                            if (fLower.includes('wayang 1') || nLower.includes('wayang 1') || nLower.includes('ksatria')) id = 'wayang1';
                            else if (fLower.includes('semar') || nLower.includes('semar')) id = 'semar';
                            else if (fLower.includes('petruk') || nLower.includes('petruk')) id = 'petruk';
                            else if (fLower.includes('gunungan') || nLower.includes('gunungan')) id = 'gunungan';
                            else id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        }

                        let src = file;
                        if (!src.includes('/')) {
                            src = `assets/wayang/${file}`;
                        } else if (src.startsWith('FotoWayang/')) {
                            src = src.replace('FotoWayang/', 'assets/wayang/');
                        }

                        WAYANG_CATALOG[id] = {
                            id: id,
                            name: name,
                            src: src,
                            heightRatio: heightRatio,
                            scaleMultiplier: (WAYANG_CATALOG[id] && WAYANG_CATALOG[id].scaleMultiplier) ? WAYANG_CATALOG[id].scaleMultiplier : 1.0,
                            offsetY: (WAYANG_CATALOG[id] && WAYANG_CATALOG[id].offsetY) ? WAYANG_CATALOG[id].offsetY : 0,
                            baseFacing: 1
                        };

                        loadWayangImage(id, src);
                    });

                    applySavedSettings();
                    this.refreshDropdowns();
                }
            } catch (err) {
                console.log("Menggunakan katalog default internal:", err);
            }
        }

        refreshDropdowns() {
            const selectKiri = document.getElementById('selectTokohKiri');
            const selectKanan = document.getElementById('selectTokohKanan');
            const selectCharToEdit = document.getElementById('selectCharToEdit');

            const currentKiri = selectKiri ? selectKiri.value : 'wayang1';
            const currentKanan = selectKanan ? selectKanan.value : 'semar';
            const currentEdit = selectCharToEdit ? selectCharToEdit.value : 'wayang1';

            [selectKiri, selectKanan, selectCharToEdit].forEach(sel => {
                if (!sel) return;
                sel.innerHTML = '';
                Object.values(WAYANG_CATALOG).forEach(char => {
                    const opt = new Option(char.name, char.id);
                    sel.add(opt);
                });
            });

            if (selectKiri && WAYANG_CATALOG[currentKiri]) selectKiri.value = currentKiri;
            if (selectKanan && WAYANG_CATALOG[currentKanan]) selectKanan.value = currentKanan;
            if (selectCharToEdit && WAYANG_CATALOG[currentEdit]) selectCharToEdit.value = currentEdit;
        }

        resizeCanvas() {
            const container = document.getElementById('stageContainer');
            if (!container) return;

            this.width = container.clientWidth;
            this.height = container.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            const floorY = this.height * 0.91;
            if (this.puppetLeft) {
                this.puppetLeft.targetY = floorY;
                this.puppetLeft.y = floorY;
            }
            if (this.puppetRight) {
                this.puppetRight.targetY = floorY;
                this.puppetRight.y = floorY;
            }
        }

        handleHandsDetected({ leftHand, rightHand, singleHand }) {
            const w = this.width;
            const h = this.height;
            const isCamActive = this.handTracker && this.handTracker.isRunning;

            if (isCamActive) {
                if (this.handMode === 'single') {
                    // MODE 1 TANGAN (FOKUS TUNGGAL): 1 tangan mulus kontinu melintasi seluruh panggung
                    const activeHand = singleHand || leftHand || rightHand;
                    if (activeHand && this.puppetLeft) {
                        this.puppetLeft.isVisible = true;
                        const extendedX = (activeHand.x - 0.5) * 1.45 + 0.5;
                        const extendedY = (activeHand.y - 0.5) * 1.35 + 0.5;

                        this.puppetLeft.targetX = extendedX * w;
                        this.puppetLeft.targetY = extendedY * h + h * 0.35;
                        this.puppetLeft.applyHandPose(activeHand);
                    } else if (this.puppetLeft) {
                        this.puppetLeft.isVisible = false;
                    }
                    if (this.puppetRight) this.puppetRight.isVisible = false;
                } else {
                    // MODE 2 TANGAN (DUET): Tangan kiri untuk tokoh kiri, tangan kanan untuk tokoh kanan
                    // Tangan Kiri
                    if (leftHand && this.puppetLeft) {
                        this.puppetLeft.isVisible = true;
                        const extendedX = (leftHand.x - 0.5) * 1.5 + 0.5;
                        const extendedY = (leftHand.y - 0.5) * 1.4 + 0.5;

                        this.puppetLeft.targetX = extendedX * w;
                        this.puppetLeft.targetY = extendedY * h + h * 0.35;
                        this.puppetLeft.applyHandPose(leftHand);
                    } else if (this.puppetLeft) {
                        this.puppetLeft.isVisible = false;
                    }

                    // Tangan Kanan
                    if (rightHand && this.puppetRight) {
                        this.puppetRight.isVisible = true;
                        const extendedX = (rightHand.x - 0.5) * 1.5 + 0.5;
                        const extendedY = (rightHand.y - 0.5) * 1.4 + 0.5;

                        this.puppetRight.targetX = extendedX * w;
                        this.puppetRight.targetY = extendedY * h + h * 0.35;
                        this.puppetRight.applyHandPose(rightHand);
                    } else if (this.puppetRight) {
                        this.puppetRight.isVisible = false;
                    }
                }
            } else {
                // Saat kamera mati (Mode Persiapan), kedua wayang selalu terlihat untuk kalibrasi & pengujian mouse
                if (this.puppetLeft) this.puppetLeft.isVisible = true;
                if (this.puppetRight) this.puppetRight.isVisible = (this.handMode === 'dual');
            }
        }

        renderLoop(currentTime) {
            const dt = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.sceneManager.update(dt);
            this.puppetLeft.update(dt);
            this.puppetRight.update(dt);

            this.ctx.clearRect(0, 0, this.width, this.height);

            // Render Latar Kelir
            this.sceneManager.draw(this.width, this.height);

            // Render Wayang Kiri & Kanan
            this.puppetLeft.draw(this.ctx, this.height);
            this.puppetRight.draw(this.ctx, this.height);

            // SINKRONISASI KE PROYEKTOR / OBS WINDOW
            if (this.syncChannel) {
                this.syncChannel.postMessage({
                    type: 'SYNC_FRAME',
                    payload: {
                        latarId: this.sceneManager.currentMotif.id,
                        blencongFlicker: this.sceneManager.blencongFlicker,
                        cloudOffset: this.sceneManager.cloudOffset,
                        puppetLeft: this.puppetLeft.getSyncData(this.width, this.height),
                        puppetRight: this.puppetRight.getSyncData(this.width, this.height)
                    }
                });
            }

            requestAnimationFrame((t) => this.renderLoop(t));
        }

        setupKeyboardShortcuts() {
            window.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

                switch (e.code) {
                    case 'KeyB':
                    case 'KeyM':
                    case 'KeyG':
                        const playing = this.soundEngine.toggleAmbient();
                        this.updateGamelanBtn(playing);
                        this.showFeedback(playing ? "Alunan Gamelan: Hidup" : "Alunan Gamelan: Hening");
                        break;
                    case 'KeyT':
                        this.toggleHandMode();
                        break;
                    case 'KeyS':
                        this.toggleGlobalSilhouette();
                        break;
                    case 'KeyF':
                        this.toggleFullscreen();
                        break;
                    case 'KeyH':
                    case 'Tab':
                        e.preventDefault();
                        this.toggleHud();
                        break;
                }
            });
        }

        setupMouseEvents() {
            const stage = document.getElementById('stageContainer');

            stage.addEventListener('mousedown', (e) => {
                this.soundEngine.resumeAudio();
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                const distLeft = Math.hypot(mx - this.puppetLeft.x, my - this.puppetLeft.y);
                const distRight = Math.hypot(mx - this.puppetRight.x, my - this.puppetRight.y);

                this.mouseDrag.puppet = distLeft < distRight ? this.puppetLeft : this.puppetRight;
                this.mouseDrag.active = true;

                this.mouseDrag.puppet.targetX = mx;
                this.mouseDrag.puppet.targetY = my;
            });

            stage.addEventListener('mousemove', (e) => {
                if (!this.mouseDrag.active || !this.mouseDrag.puppet) return;
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                this.mouseDrag.puppet.targetX = mx;
                this.mouseDrag.puppet.targetY = my;
            });

            window.addEventListener('mouseup', () => {
                this.mouseDrag.active = false;
                this.mouseDrag.puppet = null;
            });
        }

        setupUIEvents() {
            // Start Camera Button
            const camBtn = document.getElementById('startCameraBtn');
            const camStatus = document.getElementById('camStatusText');
            const sensorDot = document.getElementById('sensorStatusDot');

            if (camBtn) {
                camBtn.addEventListener('click', async () => {
                    this.soundEngine.resumeAudio();
                    const btnText = camBtn.querySelector('.btn-text');
                    if (this.handTracker.isRunning) {
                        this.handTracker.stopCamera();
                        if (btnText) btnText.innerText = "Buka Kamera";
                        camBtn.classList.remove('active');
                        if (sensorDot) sensorDot.classList.remove('active', 'error');
                        if (camStatus) {
                            camStatus.innerText = "Kamera Nonaktif (Mode Mouse)";
                            camStatus.style.color = "";
                        }
                        if (this.puppetLeft) this.puppetLeft.isVisible = true;
                        if (this.puppetRight) this.puppetRight.isVisible = true;
                        this.showFeedback("Mode Mouse (Kamera Nonaktif)");
                    } else {
                        camBtn.disabled = true;
                        if (btnText) btnText.innerText = "Menghubungkan...";

                        const ok = await this.handTracker.startCamera();
                        if (ok) {
                            if (btnText) btnText.innerText = "Matikan Kamera";
                            camBtn.classList.add('active');
                            if (sensorDot) {
                                sensorDot.classList.remove('error');
                                sensorDot.classList.add('active');
                            }
                            if (camStatus) {
                                camStatus.innerText = "Sensor Kamera Aktif";
                                camStatus.style.color = "var(--gold-bright)";
                            }
                            this.showFeedback("Sensor Kamera AI Aktif");
                        } else {
                            if (btnText) btnText.innerText = "Buka Kamera";
                            if (sensorDot) {
                                sensorDot.classList.remove('active');
                                sensorDot.classList.add('error');
                            }
                            if (camStatus) {
                                camStatus.innerText = "Akses Kamera Ditolak";
                                camStatus.style.color = "var(--soga-red)";
                            }
                            this.showAlert(
                                "Izin Kamera Diperlukan",
                                "Kamera tidak diizinkan atau tidak terdeteksi. Anda tetap dapat menggerakkan wayang di panggung kelir menggunakan Mouse atau Layar Sentuh.",
                                "warning"
                            );
                        }
                        camBtn.disabled = false;
                    }
                });
            }

            // Custom Alert Close Button
            const alertCloseBtn = document.getElementById('customAlertCloseBtn');
            if (alertCloseBtn) {
                alertCloseBtn.addEventListener('click', () => {
                    const modal = document.getElementById('customAlertModal');
                    if (modal) modal.classList.remove('active');
                });
            }

            // Close modal on backdrop click
            const alertModal = document.getElementById('customAlertModal');
            if (alertModal) {
                alertModal.addEventListener('click', (e) => {
                    if (e.target === alertModal) alertModal.classList.remove('active');
                });
            }

            // Tombol Mode 1 Tangan / 2 Tangan
            const handModeBtn = document.getElementById('handModeBtn');
            if (handModeBtn) {
                handModeBtn.addEventListener('click', () => {
                    this.toggleHandMode();
                });
            }

            // Ganti Tokoh Kiri
            const selectKiri = document.getElementById('selectTokohKiri');
            if (selectKiri) {
                selectKiri.addEventListener('change', (e) => {
                    this.puppetLeft.setCharacter(e.target.value);
                    this.showFeedback(`Tokoh Kiri: ${selectKiri.options[selectKiri.selectedIndex].text}`);
                });
            }

            // Ganti Tokoh Kanan
            const selectKanan = document.getElementById('selectTokohKanan');
            if (selectKanan) {
                selectKanan.addEventListener('change', (e) => {
                    this.puppetRight.setCharacter(e.target.value);
                    this.showFeedback(`Tokoh Kanan: ${selectKanan.options[selectKanan.selectedIndex].text}`);
                });
            }

            // Tombol Balik Arah Tokoh Kiri
            const flipKiriBtn = document.getElementById('flipKiriBtn');
            if (flipKiriBtn) {
                flipKiriBtn.addEventListener('click', () => {
                    this.puppetLeft.flipFacing();
                    this.showFeedback("Wayang Kiri Dibalik Arah");
                });
            }

            // Tombol Balik Arah Tokoh Kanan
            const flipKananBtn = document.getElementById('flipKananBtn');
            if (flipKananBtn) {
                flipKananBtn.addEventListener('click', () => {
                    this.puppetRight.flipFacing();
                    this.showFeedback("Wayang Kanan Dibalik Arah");
                });
            }

            // Mode Siluet / Warna Global (Semua Wayang)
            const globalSiluetBtn = document.getElementById('globalSiluetBtn');
            if (globalSiluetBtn) {
                globalSiluetBtn.addEventListener('click', () => {
                    this.toggleGlobalSilhouette();
                });
            }

            // Modal Pengaturan Per-Karakter (Pre-Show Settings)
            const openSettingsBtn = document.getElementById('openSettingsBtn');
            const settingsModal = document.getElementById('settingsModal');
            const closeSettingsBtn = document.getElementById('closeSettingsBtn');
            const selectCharToEdit = document.getElementById('selectCharToEdit');

            const scaleSlider = document.getElementById('charScaleSlider');
            const scaleValText = document.getElementById('charScaleValText');
            const offsetSlider = document.getElementById('charOffsetSlider');
            const offsetValText = document.getElementById('charOffsetValText');

            const loadCharIntoEditor = (charId) => {
                this.selectedCharacterToEdit = charId;
                const char = WAYANG_CATALOG[charId] || { scaleMultiplier: 1.0, offsetY: 0 };
                scaleSlider.value = char.scaleMultiplier ?? 1.0;
                scaleValText.innerText = `${Math.round((char.scaleMultiplier ?? 1.0) * 100)}%`;

                offsetSlider.value = char.offsetY ?? 0;
                offsetValText.innerText = `${char.offsetY ?? 0}px`;
            };

            if (openSettingsBtn && settingsModal) {
                openSettingsBtn.addEventListener('click', () => {
                    settingsModal.classList.add('active');
                    loadCharIntoEditor(selectCharToEdit ? selectCharToEdit.value : 'wayang1');
                });
            }

            if (closeSettingsBtn && settingsModal) {
                closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
            }

            if (selectCharToEdit) {
                selectCharToEdit.addEventListener('change', (e) => {
                    loadCharIntoEditor(e.target.value);
                });
            }

            if (scaleSlider) {
                scaleSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    scaleValText.innerText = `${Math.round(val * 100)}%`;
                    if (WAYANG_CATALOG[this.selectedCharacterToEdit]) {
                        WAYANG_CATALOG[this.selectedCharacterToEdit].scaleMultiplier = val;
                        saveCatalogSettings();
                    }
                });
            }

            if (offsetSlider) {
                offsetSlider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    offsetValText.innerText = `${val}px`;
                    if (WAYANG_CATALOG[this.selectedCharacterToEdit]) {
                        WAYANG_CATALOG[this.selectedCharacterToEdit].offsetY = val;
                        saveCatalogSettings();
                    }
                });
            }

            // Buka Jendela Bersih Proyektor / OBS
            const openProyektorBtn = document.getElementById('openProyektorBtn');
            if (openProyektorBtn) {
                openProyektorBtn.addEventListener('click', () => {
                    this.openCleanProyektorWindow();
                });
            }

            // Ganti Latar
            const latarSelect = document.getElementById('latarSelect');
            if (latarSelect) {
                latarSelect.addEventListener('change', (e) => {
                    this.sceneManager.setLatar(e.target.value);
                    this.showFeedback(`Latar: ${latarSelect.options[latarSelect.selectedIndex].text}`);
                });
            }

            // Tombol Backsound Alunan Bawaan
            const gamelanBtn = document.getElementById('gamelanToggleBtn');
            if (gamelanBtn) {
                gamelanBtn.addEventListener('click', () => {
                    const playing = this.soundEngine.toggleAmbient();
                    this.updateGamelanBtn(playing);
                    this.showFeedback(playing ? "🎵 Backsound: Hidup" : "🔇 Backsound: Mati");
                });
            }

            // Fullscreen & HUD toggle
            const fsBtn = document.getElementById('fullscreenBtn');
            if (fsBtn) fsBtn.addEventListener('click', () => this.toggleFullscreen());

            const toggleHudBtn = document.getElementById('toggleHudBtn');
            if (toggleHudBtn) toggleHudBtn.addEventListener('click', () => this.toggleHud());

            // Upload Custom PNG
            const uploadBtn = document.getElementById('uploadWayangBtn');
            const fileInput = document.getElementById('customWayangFile');
            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const img = new Image();
                            img.onload = () => {
                                const customId = 'custom_' + Date.now();
                                WAYANG_CATALOG[customId] = {
                                    id: customId,
                                    name: file.name.replace(/\.[^/.]+$/, ""),
                                    src: ev.target.result,
                                    heightRatio: 0.65,
                                    scaleMultiplier: 1.0,
                                    offsetY: 0,
                                    baseFacing: 1
                                };
                                loadedImages[customId] = img;

                                // Tambahkan ke dropdown
                                if (selectKiri) {
                                    const opt = new Option(WAYANG_CATALOG[customId].name, customId);
                                    selectKiri.add(opt);
                                }
                                if (selectKanan) {
                                    const opt = new Option(WAYANG_CATALOG[customId].name, customId);
                                    selectKanan.add(opt);
                                }
                                if (selectCharToEdit) {
                                    const opt = new Option(WAYANG_CATALOG[customId].name, customId);
                                    selectCharToEdit.add(opt);
                                }

                                this.puppetLeft.setCharacter(customId, img);
                                this.showFeedback(`Wayang "${WAYANG_CATALOG[customId].name}" Berhasil Dimuat!`);
                                saveCatalogSettings();
                            };
                            img.src = ev.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        }

        showAlert(title, message, type = 'info') {
            const modal = document.getElementById('customAlertModal');
            const titleEl = document.getElementById('customAlertTitle');
            const msgEl = document.getElementById('customAlertMessage');
            const iconEl = document.getElementById('customAlertIcon');

            if (!modal) {
                console.warn(title, message);
                return;
            }

            if (titleEl) titleEl.innerText = title;
            if (msgEl) msgEl.innerText = message;
            if (iconEl) {
                iconEl.className = 'modal-crest-icon ' + type;
                if (type === 'warning') {
                    iconEl.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>';
                } else if (type === 'success') {
                    iconEl.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
                } else {
                    iconEl.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>';
                }
            }
            modal.classList.add('active');
        }

        openCleanProyektorWindow() {
            const popup = window.open(
                'proyektor.html',
                'WayangProyektorWindow',
                'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
            );
            if (popup) {
                this.proyektorWindow = popup;
                this.showFeedback("Layar Proyektor Terbuka");
            } else {
                this.showAlert(
                    "Jendela Proyektor Terblokir",
                    "Peramban Anda memblokir jendela baru otomatis. Silakan klik ikon 'Izinkan pop-up' di bilah alamat atas peramban untuk membuka Layar Proyektor.",
                    "warning"
                );
            }
        }

        updateGamelanBtn(isPlaying) {
            const btn = document.getElementById('gamelanToggleBtn');
            if (btn) {
                btn.classList.toggle('active', isPlaying);
                const btnText = btn.querySelector('.btn-text');
                if (btnText) {
                    btnText.innerText = isPlaying ? "Heningkan" : "Gamelan";
                }
            }
        }

        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => console.warn(e));
                this.showFeedback("Layar Penuh (Tekan ESC atau F untuk keluar)");
            } else {
                document.exitFullscreen().catch(e => console.warn(e));
            }
        }

        toggleHandMode() {
            this.handMode = (this.handMode === 'dual') ? 'single' : 'dual';
            const btn = document.getElementById('handModeBtn');
            const kananSection = document.getElementById('kananControlSection');

            if (btn) {
                const btnText = btn.querySelector('.btn-text');
                if (btnText) {
                    btnText.innerText = (this.handMode === 'dual') ? '2 Tangan' : '1 Tangan';
                }
                btn.classList.toggle('active', this.handMode === 'single');
            }

            if (kananSection) {
                kananSection.style.opacity = (this.handMode === 'single') ? '0.35' : '1.0';
                kananSection.style.pointerEvents = (this.handMode === 'single') ? 'none' : 'auto';
            }

            if (this.handMode === 'single') {
                if (this.puppetRight) this.puppetRight.isVisible = false;
                this.showFeedback("Mode 1 Tangan: Kendali Layar Penuh");
            } else {
                if (this.puppetRight) this.puppetRight.isVisible = true;
                this.showFeedback("Mode 2 Tangan: Duet Tokoh Kiri & Kanan");
            }
        }

        toggleGlobalSilhouette() {
            this.isGlobalSilhouette = !this.isGlobalSilhouette;
            if (this.puppetLeft) this.puppetLeft.isSilhouette = this.isGlobalSilhouette;
            if (this.puppetRight) this.puppetRight.isSilhouette = this.isGlobalSilhouette;

            const btn = document.getElementById('globalSiluetBtn');
            if (btn) {
                const btnText = btn.querySelector('.btn-text');
                if (btnText) {
                    btnText.innerText = this.isGlobalSilhouette ? "Siluet" : "Warna Asli";
                }
                btn.classList.toggle('active', !this.isGlobalSilhouette);
            }

            this.showFeedback(this.isGlobalSilhouette ? "Mode Siluet Klasik Aktif" : "Mode Warna Asli Aktif");
        }

        toggleHud() {
            this.isHudVisible = !this.isHudVisible;
            const hud = document.getElementById('dalangHud');
            const hudBtn = document.getElementById('toggleHudBtn');
            if (hud) hud.classList.toggle('hidden', !this.isHudVisible);
            if (hudBtn) {
                hudBtn.title = this.isHudVisible ? "Sembunyikan Konsol (H)" : "Buka Konsol (H)";
                hudBtn.innerHTML = this.isHudVisible 
                    ? `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
                    : `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;
            }
        }

        showFeedback(text) {
            const badge = document.getElementById('actionBadge');
            const toastText = document.getElementById('toastText');
            if (!badge) return;

            // Bersihkan segala sisa emotikon jika ada
            const cleanText = String(text).replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

            if (toastText) {
                toastText.innerText = cleanText;
            } else {
                badge.innerText = cleanText;
            }

            badge.classList.remove('show');
            void badge.offsetWidth;
            badge.classList.add('show');

            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                badge.classList.remove('show');
            }, 2000);
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.wayangApp = new WayangDigitalApp();
    });
})();
