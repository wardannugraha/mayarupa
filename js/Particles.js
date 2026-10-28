/* ==========================================================================
   WAYANG DIGITAL - PARTICLE & ATMOSPHERE SYSTEM
   Smoke / Incense Dupa, Blencong Embers, Clash Sparks
   ========================================================================== */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.sparks = [];
        this.maxParticles = 75;
    }

    /**
     * Update & Draw Smoke and Embers
     */
    updateAndDraw(ctx, width, height, blencongPos) {
        // Spawn gentle incense smoke from bottom
        if (this.particles.length < this.maxParticles && Math.random() < 0.35) {
            this.particles.push({
                x: width * 0.2 + Math.random() * (width * 0.6),
                y: height + 10,
                vx: (Math.random() - 0.5) * 0.6,
                vy: -(0.5 + Math.random() * 0.9),
                radius: 15 + Math.random() * 25,
                alpha: 0.08 + Math.random() * 0.08,
                life: 1.0,
                decay: 0.003 + Math.random() * 0.003,
                type: 'smoke'
            });
        }

        // Spawn Blencong glowing embers around light source
        if (blencongPos && Math.random() < 0.25) {
            this.particles.push({
                x: blencongPos.x + (Math.random() - 0.5) * 40,
                y: blencongPos.y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 1.2,
                vy: -(1.0 + Math.random() * 1.5),
                radius: 1.5 + Math.random() * 2.5,
                alpha: 0.8,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.015,
                type: 'ember'
            });
        }

        // Update & Render Ambient Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.type === 'smoke') {
                p.radius += 0.2;
                p.alpha = Math.sin(p.life * Math.PI) * 0.07;

                ctx.save();
                ctx.fillStyle = `rgba(245, 230, 200, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (p.type === 'ember') {
                ctx.save();
                ctx.fillStyle = `rgba(255, 200, 50, ${p.life * 0.8})`;
                ctx.shadowColor = '#ff9900';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            if (p.life <= 0 || p.y < -50) {
                this.particles.splice(i, 1);
            }
        }

        // Update & Render Battle Clash Sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.15; // Gravity
            s.life -= s.decay;

            ctx.save();
            ctx.strokeStyle = `rgba(255, 235, 120, ${s.life})`;
            ctx.lineWidth = s.size;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3);
            ctx.stroke();
            ctx.restore();

            if (s.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
    }

    /**
     * Buat ledakan percikan saat wayang bertarung (Clash Effect)
     */
    createClashSparks(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 6.5;
            this.sparks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                size: 1.5 + Math.random() * 2,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.03
            });
        }
    }
}
