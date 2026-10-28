/* ==========================================================================
   WAYANG DIGITAL - SCENE & KELIR STAGE MANAGER
   Realistic Kelir Fabric, Flickering Blencong Light, Gedebog Pisang, Scenes
   ========================================================================== */

export const SCENE_PRESETS = {
    jejer: {
        id: 'jejer',
        name: 'Jejer Keraton (Istana)',
        desc: 'Suasana agung keemasan paseban agung',
        blencongColor: '#ffaa33',
        blencongIntensity: 1.0,
        kelirColorTop: '#fff9ea',
        kelirColorBottom: '#e6c891',
        shadowBlur: 8,
        ambientMood: 'majestic'
    },
    garagara: {
        id: 'garagara',
        name: 'Gara-Gara (Tengah Malam)',
        desc: 'Suasana mistis malam punakawan bercanda',
        blencongColor: '#ff8833',
        blencongIntensity: 0.85,
        kelirColorTop: '#3a2e4c',
        kelirColorBottom: '#c89d67',
        shadowBlur: 14,
        ambientMood: 'mystic'
    },
    perangkembang: {
        id: 'perangkembang',
        name: 'Perang Kembang (Hutan)',
        desc: 'Pertarungan ksatria melawan buto cakil',
        blencongColor: '#ff7722',
        blencongIntensity: 1.15,
        kelirColorTop: '#2b3a2a',
        kelirColorBottom: '#b8905a',
        shadowBlur: 6,
        ambientMood: 'forest'
    },
    baratayudha: {
        id: 'baratayudha',
        name: 'Perang Baratayudha (Kurusetra)',
        desc: 'Laga puncak perang suci dharma vs adharma',
        blencongColor: '#ff4411',
        blencongIntensity: 1.3,
        kelirColorTop: '#4a1515',
        kelirColorBottom: '#c27d42',
        shadowBlur: 10,
        ambientMood: 'epic'
    }
};

export class SceneManager {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        this.currentScene = SCENE_PRESETS.jejer;
        this.blencong = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            flicker: 1.0,
            flickerSpeed: 0.05,
            flickerAmount: 0.06,
            time: 0
        };

        this.showGedebog = true;
        this.showBlencongGlow = true;
    }

    setScene(sceneId) {
        if (SCENE_PRESETS[sceneId]) {
            this.currentScene = SCENE_PRESETS[sceneId];
        }
    }

    update(dt = 0.016) {
        // Blencong Light Flickering Simulation (Api Minyak Nyala Bergetar Alami)
        this.blencong.time += dt * 6.0;
        const noise = Math.sin(this.blencong.time) * 0.5 + Math.sin(this.blencong.time * 2.3) * 0.3 + (Math.random() - 0.5) * 0.2;
        this.blencong.flicker = 1.0 + noise * this.blencong.flickerAmount;

        // Blencong center light follows puppet midpoint or center of screen
        this.blencong.x += (this.blencong.targetX - this.blencong.x) * 0.08;
        this.blencong.y += (this.blencong.targetY - this.blencong.y) * 0.08;
    }

    /**
     * Render Latar Kelir (Kain Putih Berteksur Serat + Pencahayaan Blencong)
     */
    drawBackground(width, height) {
        const ctx = this.ctx;
        const scene = this.currentScene;

        // Default Blencong position (Center top)
        if (this.blencong.targetX === 0) {
            this.blencong.x = width * 0.5;
            this.blencong.y = height * 0.22;
            this.blencong.targetX = this.blencong.x;
            this.blencong.targetY = this.blencong.y;
        }

        // 1. Base Kelir Canvas Gradient
        const kelirGrad = ctx.createLinearGradient(0, 0, 0, height);
        kelirGrad.addColorStop(0, scene.kelirColorTop);
        kelirGrad.addColorStop(1, scene.kelirColorBottom);
        ctx.fillStyle = kelirGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Blencong Radial Light (Cahaya Api Minyak)
        if (this.showBlencongGlow) {
            const bx = this.blencong.x;
            const by = this.blencong.y;
            const radius = Math.max(width, height) * 0.85 * this.blencong.flicker * scene.blencongIntensity;

            const lightGrad = ctx.createRadialGradient(bx, by, 30, bx, by, radius);
            lightGrad.addColorStop(0, 'rgba(255, 245, 210, 0.95)');
            lightGrad.addColorStop(0.2, 'rgba(255, 210, 120, 0.65)');
            lightGrad.addColorStop(0.5, 'rgba(220, 140, 50, 0.35)');
            lightGrad.addColorStop(0.85, 'rgba(60, 30, 10, 0.7)');
            lightGrad.addColorStop(1.0, 'rgba(15, 8, 4, 0.95)');

            ctx.save();
            ctx.fillStyle = lightGrad;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // 3. Tekstur Halus Serat Kain Kelir (Cloth Grain)
        this.drawKelirClothGrain(ctx, width, height);
    }

    drawKelirClothGrain(ctx, width, height) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.015)';
        ctx.lineWidth = 1;
        // Subtle vertical cloth weave
        for (let x = 0; x < width; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Render Gedebog Pisang (Batang Pisang Tempat Tancapan Wayang di Bawah Layar)
     */
    drawGedebogPisang(width, height) {
        if (!this.showGedebog) return;
        const ctx = this.ctx;
        const gedebogH = Math.max(70, height * 0.12);
        const gedebogY = height - gedebogH;

        ctx.save();

        // 1. Shadow di atas batang pisang
        const shadowGrad = ctx.createLinearGradient(0, gedebogY - 25, 0, gedebogY);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, gedebogY - 25, width, 25);

        // 2. Batang Gedebog Pisang (Hijau Lumut & Serat Batang Pisang Tua)
        const trunkGrad = ctx.createLinearGradient(0, gedebogY, 0, height);
        trunkGrad.addColorStop(0, '#4a4422');
        trunkGrad.addColorStop(0.3, '#2e3316');
        trunkGrad.addColorStop(0.7, '#1f240e');
        trunkGrad.addColorStop(1, '#0e1106');

        ctx.fillStyle = trunkGrad;
        ctx.fillRect(0, gedebogY, width, gedebogH);

        // 3. Garis-garis Serat Batang Pisang Melintang
        ctx.strokeStyle = 'rgba(200, 180, 80, 0.12)';
        ctx.lineWidth = 2;
        for (let y = gedebogY + 12; y < height; y += 14) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 4. Lubang / Tancapan Cempurit Wayang di Gedebog
        ctx.fillStyle = '#0a0d05';
        for (let x = 60; x < width; x += 110) {
            ctx.beginPath();
            ctx.ellipse(x, gedebogY + 8, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. Ornamen List Kayu Ukiran Jawa di Batang Bawah
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(0, gedebogY, width, 4);

        ctx.restore();
    }

    /**
     * Bingkai Ornamen Kelir Jawa (Plengkungan & Ukiran Emas)
     */
    drawStageFrame(width, height) {
        const ctx = this.ctx;
        const borderW = 16;

        ctx.save();
        // Golden Bronze Border Frame
        ctx.fillStyle = '#3a2510';
        ctx.fillRect(0, 0, width, borderW); // Top
        ctx.fillRect(0, 0, borderW, height); // Left
        ctx.fillRect(width - borderW, 0, borderW, height); // Right

        // Gold Trim Line
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(borderW - 2, borderW - 2, width - (borderW - 2) * 2, height - borderW);

        ctx.restore();
    }
}
