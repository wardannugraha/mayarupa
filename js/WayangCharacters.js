/* ==========================================================================
   WAYANG DIGITAL - CHARACTER DEFINITIONS & ORNAMENT RENDERERS
   Authentic Vector Art for Gunungan, Gatotkaca, Arjuna, Buto, Semar
   ========================================================================== */

export const WAYANG_DATABASE = {
    gunungan: {
        id: 'gunungan',
        name: 'Gunungan (Kayon)',
        title: 'Simbol Alam Semesta & Pembuka Babak',
        isGunungan: true,
        scale: 1.1,
        color: '#c9933b',
        shadowColor: '#120d08',
        accentColor: '#e5a823'
    },
    gatotkaca: {
        id: 'gatotkaca',
        name: 'Raden Gatotkaca',
        title: 'Satria Pringgandani - Otot Kawat Balung Wesi',
        isGunungan: false,
        scale: 1.0,
        color: '#d4af37',
        faceColor: '#2b1d0c',
        bodyType: 'gagah',
        leftArm: { shoulderX: -18, shoulderY: -65, upperLen: 55, lowerLen: 60 },
        rightArm: { shoulderX: 22, shoulderY: -60, upperLen: 55, lowerLen: 60 }
    },
    arjuna: {
        id: 'arjuna',
        name: 'Raden Arjuna (Janaka)',
        title: 'Satria Madukara - Penengah Pandawa',
        isGunungan: false,
        scale: 0.95,
        color: '#e5c158',
        faceColor: '#1e1408',
        bodyType: 'halus',
        leftArm: { shoulderX: -14, shoulderY: -62, upperLen: 52, lowerLen: 58 },
        rightArm: { shoulderX: 18, shoulderY: -58, upperLen: 52, lowerLen: 58 }
    },
    buto: {
        id: 'buto',
        name: 'Buto Cakil / Rahwana',
        title: 'Raksasa Angkara Murka',
        isGunungan: false,
        scale: 1.15,
        color: '#b23b23',
        faceColor: '#3a110a',
        bodyType: 'buto',
        leftArm: { shoulderX: -26, shoulderY: -70, upperLen: 65, lowerLen: 70 },
        rightArm: { shoulderX: 28, shoulderY: -65, upperLen: 65, lowerLen: 70 }
    },
    semar: {
        id: 'semar',
        name: 'Kyai Lurah Semar',
        title: 'Sesepuh Punakawan - Pamomong Pandawa',
        isGunungan: false,
        scale: 0.9,
        color: '#caa05d',
        faceColor: '#20160a',
        bodyType: 'punakawan',
        leftArm: { shoulderX: -10, shoulderY: -45, upperLen: 38, lowerLen: 42 },
        rightArm: { shoulderX: 26, shoulderY: -42, upperLen: 38, lowerLen: 42 }
    }
};

export class WayangRenderer {
    /**
     * Render Wayang Utama ke Canvas Context dengan detail tatah & sungging
     */
    static drawPuppet(ctx, puppet, isShadowMode = true) {
        ctx.save();
        ctx.translate(puppet.x, puppet.y);
        ctx.rotate(puppet.rotation);
        ctx.scale(puppet.facing * puppet.scale, puppet.scale);

        // Jika Gunungan
        if (puppet.character.isGunungan) {
            this.drawGunungan(ctx, puppet, isShadowMode);
            ctx.restore();
            return;
        }

        // Draw Central Cempurit Stick (Tangkai Induk Wayang dari Tanduk Kerbau)
        this.drawCempuritInduk(ctx, puppet);

        // Draw Left Arm (Back Arm)
        this.drawArm(ctx, puppet, 'left', isShadowMode);

        // Draw Main Body (Head, Torso, Dodot Cloth, Feet)
        this.drawBody(ctx, puppet, isShadowMode);

        // Draw Right Arm (Front Arm)
        this.drawArm(ctx, puppet, 'right', isShadowMode);

        ctx.restore();
    }

    /**
     * Tangkai Cempurit Utama (Gagang Kayu/Tanduk Pengikat Wayang)
     */
    static drawCempuritInduk(ctx, puppet) {
        ctx.save();
        ctx.strokeStyle = '#221509';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        // Tangkai dari bawah badan memanjang ke bawah layar
        ctx.beginPath();
        ctx.moveTo(0, -90);
        ctx.lineTo(0, 160);
        ctx.stroke();

        // Pangkal tangkai berulir
        ctx.strokeStyle = '#4a2f15';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(0, 175);
        ctx.stroke();

        // Tali pengikat emas cempurit
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        for (let y = -70; y <= 40; y += 25) {
            ctx.beginPath();
            ctx.moveTo(-5, y);
            ctx.lineTo(5, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Render Lengan Wayang (Bahu -> Siku -> Tangan + Batang Tuding)
     */
    static drawArm(ctx, puppet, side, isShadowMode) {
        const armConfig = puppet.character[side === 'left' ? 'leftArm' : 'rightArm'];
        if (!armConfig) return;

        const armState = puppet[side === 'left' ? 'leftArmState' : 'rightArmState'];
        const shX = armConfig.shoulderX;
        const shY = armConfig.shoulderY;

        ctx.save();

        // 1. Upper Arm (Lengan Atas)
        ctx.translate(shX, shY);
        ctx.rotate(armState.upperAngle);

        this.drawUpperArmSegment(ctx, armConfig.upperLen, puppet.character, side);

        // 2. Forearm & Hand (Lengan Bawah & Telapak)
        ctx.translate(0, armConfig.upperLen);
        ctx.rotate(armState.lowerAngle);

        this.drawLowerArmSegment(ctx, armConfig.lowerLen, puppet.character, side);

        // 3. Tuding Stick (Tangkai Penggerak Tangan Wayang)
        this.drawTuding(ctx, armConfig.lowerLen);

        ctx.restore();
    }

    static drawUpperArmSegment(ctx, length, character, side) {
        ctx.save();
        // Pivot joint ornament
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Lengan Atas Path
        ctx.fillStyle = character.faceColor || '#221509';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.bezierCurveTo(-8, length * 0.4, -6, length * 0.8, -4, length);
        ctx.lineTo(4, length);
        ctx.bezierCurveTo(6, length * 0.8, 8, length * 0.4, 5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Kelat Bahu (Gelang Bahu Emas Wayang)
        ctx.fillStyle = '#e5a823';
        ctx.beginPath();
        ctx.arc(0, 10, 6, 0, Math.PI);
        ctx.fill();

        ctx.restore();
    }

    static drawLowerArmSegment(ctx, length, character, side) {
        ctx.save();
        // Siku Joint Pin
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Lengan Bawah & Jari Melengkung Khas Wayang Kulit
        ctx.fillStyle = character.faceColor || '#221509';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-3, length * 0.7);
        // Jari jemari melentik (ngiting / nyempurit)
        ctx.bezierCurveTo(-8, length * 0.85, -12, length * 0.95, -6, length);
        ctx.bezierCurveTo(-2, length * 1.05, 4, length * 0.95, 3, length * 0.7);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gelang Kana (Gelang Pergelangan Tangan Emas)
        ctx.fillStyle = '#e5a823';
        ctx.fillRect(-5, length * 0.6, 10, 4);

        ctx.restore();
    }

    static drawTuding(ctx, armLength) {
        ctx.save();
        // Batang tuding bambu/tanduk halus yang dipegang dalang
        ctx.strokeStyle = '#3d2510';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(0, armLength * 0.9);
        ctx.lineTo(10, armLength * 0.9 + 110);
        ctx.stroke();

        // Benang pengikat ujung tuding ke tangan
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, armLength * 0.9, 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Render Badan Utama Karakter Wayang Sesuai Tipenya
     */
    static drawBody(ctx, puppet, isShadowMode) {
        const char = puppet.character;
        ctx.save();

        switch (char.id) {
            case 'gatotkaca':
                this.drawGatotkacaBody(ctx, char);
                break;
            case 'arjuna':
                this.drawArjunaBody(ctx, char);
                break;
            case 'buto':
                this.drawButoBody(ctx, char);
                break;
            case 'semar':
                this.drawSemarBody(ctx, char);
                break;
            default:
                this.drawGenericWayang(ctx, char);
        }

        ctx.restore();
    }

    /**
     * 1. GATOTKACA: Sayap Kotang Antakusuma, Mahkota Makuta, Otot Dada, Jarik
     */
    static drawGatotkacaBody(ctx, char) {
        ctx.fillStyle = '#1e1408';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.8;

        // Sayap Kotang Antakusuma di Punggung
        ctx.fillStyle = '#a82c18';
        ctx.beginPath();
        ctx.moveTo(-15, -60);
        ctx.bezierCurveTo(-60, -90, -75, -40, -45, -20);
        ctx.bezierCurveTo(-65, -10, -50, 20, -20, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ornamen Ukiran Sayap
        ctx.strokeStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-20, -55);
        ctx.lineTo(-55, -65);
        ctx.moveTo(-25, -40);
        ctx.lineTo(-60, -35);
        ctx.moveTo(-20, -20);
        ctx.lineTo(-45, -5);
        ctx.stroke();

        // Kaki & Jarik Batik Parang Rusak
        ctx.fillStyle = '#1e1408';
        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(-28, 95);
        ctx.lineTo(-12, 105);
        ctx.lineTo(5, 45);
        ctx.lineTo(25, 95);
        ctx.lineTo(40, 105);
        ctx.lineTo(25, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Celana Cinde & Dodot
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.bezierCurveTo(-25, 40, -10, 60, 0, 70);
        ctx.bezierCurveTo(15, 60, 30, 40, 25, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dada & Baju Zirah Kotang Antakusuma
        ctx.fillStyle = '#1c1308';
        ctx.beginPath();
        ctx.moveTo(-22, -65);
        ctx.lineTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(22, -65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Kalung Bulan Sabat & Badhong Emas
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -45, 12, 0, Math.PI);
        ctx.fill();

        // Kepala & Wajah Gagah Ksatria
        ctx.fillStyle = '#1e1408';
        ctx.beginPath();
        ctx.moveTo(-10, -65);
        ctx.bezierCurveTo(-15, -80, -5, -95, 15, -90);
        // Hidung Mancung Ksatria
        ctx.lineTo(28, -82);
        ctx.lineTo(16, -75);
        // Kumis & Dagu
        ctx.lineTo(22, -70);
        ctx.lineTo(8, -65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mahkota Makuta & Garuda Mungkur di Belakang Kepala
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(5, -92);
        ctx.bezierCurveTo(20, -120, -15, -125, -25, -95);
        ctx.bezierCurveTo(-40, -85, -30, -70, -12, -78);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mata Telengan Gagah & Sumping Telinga
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(12, -80, 4, 2.5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(13, -80, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 2. ARJUNA: Posture Halus, Gelung Supit Urang, Wajah Luruh, Panah Pasopati
     */
    static drawArjunaBody(ctx, char) {
        ctx.fillStyle = '#1e1408';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.6;

        // Busur Panah Pasopati di Punggung
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-22, -40, 45, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-22 + 45 * Math.cos(-Math.PI * 0.4), -40 + 45 * Math.sin(-Math.PI * 0.4));
        ctx.lineTo(-22 + 45 * Math.cos(Math.PI * 0.4), -40 + 45 * Math.sin(Math.PI * 0.4));
        ctx.stroke();

        // Kaki Langkah Ksatria Halus
        ctx.fillStyle = '#1e1408';
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(-20, 95);
        ctx.lineTo(-8, 102);
        ctx.lineTo(2, 45);
        ctx.lineTo(18, 95);
        ctx.lineTo(30, 102);
        ctx.lineTo(18, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Kain Jarik Parang Kusumo Halus
        ctx.fillStyle = '#c89d32';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.bezierCurveTo(-20, 35, -5, 55, 0, 65);
        ctx.bezierCurveTo(10, 55, 22, 35, 18, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dada Ramping & Kalung Bulan Sabat
        ctx.fillStyle = '#1a1206';
        ctx.beginPath();
        ctx.moveTo(-16, -62);
        ctx.lineTo(-14, 0);
        ctx.lineTo(16, 0);
        ctx.lineTo(18, -62);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Kalung Emas
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -45, 9, 0, Math.PI);
        ctx.fill();

        // Kepala Menunduk (Luruh / Refined Virtue)
        ctx.fillStyle = '#1e1408';
        ctx.beginPath();
        ctx.moveTo(-8, -62);
        ctx.bezierCurveTo(-12, -76, -2, -90, 12, -86);
        // Hidung Lancip Halus
        ctx.lineTo(26, -78);
        ctx.lineTo(14, -73);
        // Bibir & Dagu Halus
        ctx.lineTo(18, -68);
        ctx.lineTo(6, -62);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rambut Gelung Supit Urang (Melengkung Indah ke Atas)
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(2, -88);
        ctx.bezierCurveTo(12, -118, -25, -120, -22, -90);
        ctx.bezierCurveTo(-35, -80, -25, -68, -10, -74);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mata Liyepan (Mata Sipit Halus Ksatria)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(10, -76, 3.5, 1.5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(11, -76, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 3. BUTO CAKIL / RAHWANA: Taring Menyeringai, Mata Belalak, Tubuh Raksasa
     */
    static drawButoBody(ctx, char) {
        ctx.fillStyle = '#3a110a';
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2.0;

        // Kaki Kekar Langkah Lebar
        ctx.beginPath();
        ctx.moveTo(-20, 10);
        ctx.lineTo(-38, 105);
        ctx.lineTo(-18, 115);
        ctx.lineTo(8, 50);
        ctx.lineTo(35, 105);
        ctx.lineTo(55, 115);
        ctx.lineTo(32, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Celana Motif Cinde Merah
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-26, 0);
        ctx.bezierCurveTo(-32, 45, -12, 70, 0, 78);
        ctx.bezierCurveTo(20, 70, 38, 45, 30, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Perut Buncit & Dada Berbulu
        ctx.fillStyle = '#3a110a';
        ctx.beginPath();
        ctx.moveTo(-28, -70);
        ctx.bezierCurveTo(-35, -30, -32, 0, -25, 0);
        ctx.lineTo(28, 0);
        ctx.bezierCurveTo(36, -30, 32, -70, 26, -70);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sabuk Emas & Pending Raksasa
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-22, -10, 46, 12);

        // Kepala Menghadap Lawan dengan Taring Bawah Menusuk Atas
        ctx.fillStyle = '#3a110a';
        ctx.beginPath();
        ctx.moveTo(-15, -70);
        ctx.bezierCurveTo(-22, -90, -5, -108, 20, -100);
        // Hidung Besar Bapang
        ctx.lineTo(38, -92);
        ctx.lineTo(24, -82);
        // Rahang Mulut Menganga & Taring Bawah
        ctx.lineTo(34, -78);
        ctx.lineTo(36, -88); // Taring
        ctx.lineTo(28, -75);
        ctx.lineTo(18, -68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Taring Putih Mengkilap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(27, -76);
        ctx.lineTo(34, -86);
        ctx.lineTo(30, -74);
        ctx.closePath();
        ctx.fill();

        // Rambut Gimbal / Mahkota Raksasa Berapi
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(10, -102);
        ctx.bezierCurveTo(30, -135, -20, -135, -35, -102);
        ctx.bezierCurveTo(-50, -90, -40, -75, -18, -82);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mata Thelengan Membelalak Merah
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(15, -88, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(15, -88, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 4. SEMAR: Sosok Bulat Filosofis, Kuncung Putih, Sarung Kampuh Poleng
     */
    static drawSemarBody(ctx, char) {
        ctx.fillStyle = '#20160a';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.8;

        // Badan Gemuk Bulat Ikonik Semar
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sarung Poleng Hitam Putih / Catur Warna Semar
        ctx.save();
        ctx.clip();
        const gridSize = 12;
        for (let gx = -40; gx < 40; gx += gridSize) {
            for (let gy = -40; gy < 45; gy += gridSize) {
                if ((Math.floor(gx / gridSize) + Math.floor(gy / gridSize)) % 2 === 0) {
                    ctx.fillStyle = '#e8d8b8';
                    ctx.fillRect(gx, gy, gridSize, gridSize);
                } else {
                    ctx.fillStyle = '#181208';
                    ctx.fillRect(gx, gy, gridSize, gridSize);
                }
            }
        }
        ctx.restore();

        // Kaki Pendek Kokoh
        ctx.fillStyle = '#20160a';
        ctx.beginPath();
        ctx.arc(-14, 45, 10, 0, Math.PI);
        ctx.arc(16, 45, 10, 0, Math.PI);
        ctx.fill();
        ctx.stroke();

        // Kepala & Wajah Tersenyum Bijak
        ctx.beginPath();
        ctx.arc(6, -42, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Kuncung Rambut Putih Khas Semar
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(4, -58);
        ctx.bezierCurveTo(12, -75, -8, -80, -4, -60);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mata Sipit Tersenyum & Hidung Bulat
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(10, -42, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Hidung Tompel
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(16, -40, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 5. GUNUNGAN / KAYON: Pohon Hayat Kosmologi Jawa
     */
    static drawGunungan(ctx, puppet, isShadowMode) {
        ctx.save();
        const w = 110;
        const h = 240;

        // Tangkai Cempurit Gunungan
        ctx.strokeStyle = '#28170b';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 180);
        ctx.stroke();

        // Bentuk Daun Segitiga Melengkung (Kayon)
        ctx.beginPath();
        ctx.moveTo(0, -h); // Ujung Atas Runcing
        ctx.bezierCurveTo(w * 0.4, -h * 0.8, w * 0.95, -h * 0.5, w * 0.9, -h * 0.2);
        ctx.bezierCurveTo(w * 0.85, 0, w * 0.5, h * 0.1, 0, h * 0.15);
        ctx.bezierCurveTo(-w * 0.5, h * 0.1, -w * 0.85, 0, -w * 0.9, -h * 0.2);
        ctx.bezierCurveTo(-w * 0.95, -h * 0.5, -w * 0.4, -h * 0.8, 0, -h);
        ctx.closePath();

        // Gradien Emas & Merah Api Mistis
        const grad = ctx.createLinearGradient(0, -h, 0, h * 0.15);
        grad.addColorStop(0, '#ffd700');
        grad.addColorStop(0.3, '#d4af37');
        grad.addColorStop(0.7, '#8b2500');
        grad.addColorStop(1, '#1e1408');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ukiran Ornamen Gapura Rumah Banon (Gerbang Suci)
        ctx.fillStyle = '#1e1408';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;

        // Gerbang Kotak
        ctx.fillRect(-28, -50, 56, 65);
        ctx.strokeRect(-28, -50, 56, 65);

        // Atap Candi Bentar
        ctx.beginPath();
        ctx.moveTo(-35, -50);
        ctx.lineTo(0, -85);
        ctx.lineTo(35, -50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pohon Hayat Raksasa di Tengah
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -85);
        ctx.lineTo(0, -h * 0.85);

        // Cabang-cabang rimbun
        for (let i = 0; i < 6; i++) {
            const yBranch = -90 - i * 20;
            const spread = 25 + i * 8;
            ctx.moveTo(0, yBranch);
            ctx.quadraticCurveTo(spread * 0.5, yBranch - 10, spread, yBranch - 20);
            ctx.moveTo(0, yBranch);
            ctx.quadraticCurveTo(-spread * 0.5, yBranch - 10, -spread, yBranch - 20);
        }
        ctx.stroke();

        // Dua Raksasa Penjaga Cingkarabala & Balaupata di Kanan Kiri Pintu
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(-16, -20, 6, 0, Math.PI * 2);
        ctx.arc(16, -20, 6, 0, Math.PI * 2);
        ctx.fill();

        // Kepala Kala (Batara Kala) di Atas Gerbang
        ctx.fillStyle = '#b22222';
        ctx.beginPath();
        ctx.arc(0, -75, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static drawGenericWayang(ctx, char) {
        ctx.fillStyle = char.color || '#d4af37';
        ctx.beginPath();
        ctx.arc(0, -60, 20, 0, Math.PI * 2);
        ctx.fillRect(-15, -40, 30, 80);
        ctx.fill();
    }
}
