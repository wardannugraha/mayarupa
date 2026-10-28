/* ==========================================================================
   WAYANG DIGITAL - PUPPET RIG & 2D KINEMATICS ENGINE
   Calculates Joint Rotations, Inertia Sway, Arm Inverse Kinematics
   ========================================================================== */

import { WAYANG_DATABASE, WayangRenderer } from './WayangCharacters.js';

export class PuppetRig {
    constructor(id, characterId = 'gatotkaca', initialX = 400, initialY = 500, facing = 1) {
        this.id = id;
        this.characterId = characterId;
        this.character = WAYANG_DATABASE[characterId] || WAYANG_DATABASE.gatotkaca;

        // Position & Transforms
        this.x = initialX;
        this.y = initialY;
        this.targetX = initialX;
        this.targetY = initialY;
        this.zDepth = 1.0; // Distance to screen (Affects shadow blur & size)
        
        this.vx = 0;
        this.vy = 0;
        this.facing = facing; // 1 = Hadap Kanan, -1 = Hadap Kiri
        this.scale = this.character.scale || 1.0;
        this.targetScale = this.scale;
        this.rotation = 0;
        this.swayAngle = 0;

        // Arms State (Upper Arm Angle, Lower Arm Angle in Radians)
        this.leftArmState = {
            upperAngle: 0.5,
            lowerAngle: 0.8,
            targetUpper: 0.5,
            targetLower: 0.8
        };

        this.rightArmState = {
            upperAngle: -0.5,
            lowerAngle: -0.8,
            targetUpper: -0.5,
            targetLower: -0.8
        };

        // Status
        this.isGrounded = true; // Ditancapkan di gedebog pisang
        this.isAttacking = false;
        this.attackCooldown = 0;
    }

    setCharacter(characterId) {
        if (WAYANG_DATABASE[characterId]) {
            this.characterId = characterId;
            this.character = WAYANG_DATABASE[characterId];
            this.scale = this.character.scale || 1.0;
        }
    }

    /**
     * Update physics, smoothing, and kinematics
     */
    update(dt = 0.016) {
        // Smooth position interpolation (Lerp with inertia)
        const lerpFactor = 0.18;
        const prevX = this.x;
        const prevY = this.y;

        this.x += (this.targetX - this.x) * lerpFactor;
        this.y += (this.targetY - this.y) * lerpFactor;

        this.vx = (this.x - prevX);
        this.vy = (this.y - prevY);

        // Realistic Dalang Sway (Goyangan tangkai cempurit saat digerakkan)
        const targetSway = (this.vx * 0.035) * this.facing;
        this.swayAngle += (targetSway - this.swayAngle) * 0.15;
        this.rotation = this.swayAngle;

        // Smooth Arm Joint Rotations
        const armLerp = 0.22;
        this.leftArmState.upperAngle += (this.leftArmState.targetUpper - this.leftArmState.upperAngle) * armLerp;
        this.leftArmState.lowerAngle += (this.leftArmState.targetLower - this.leftArmState.lowerAngle) * armLerp;

        this.rightArmState.upperAngle += (this.rightArmState.targetUpper - this.rightArmState.upperAngle) * armLerp;
        this.rightArmState.lowerAngle += (this.rightArmState.targetLower - this.rightArmState.lowerAngle) * armLerp;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
    }

    /**
     * Inverse Kinematics 2-Sendi untuk Menggerakkan Lengan Wayang
     * Memetakan posisi target tuding tangan (targetX, targetY relative to shoulder)
     */
    solveArmIK(side, relTargetX, relTargetY) {
        const armConfig = this.character[side === 'left' ? 'leftArm' : 'rightArm'];
        if (!armConfig) return;

        const L1 = armConfig.upperLen;
        const L2 = armConfig.lowerLen;

        // Jarak dari bahu ke target
        const distSq = relTargetX * relTargetX + relTargetY * relTargetY;
        const dist = Math.sqrt(distSq);

        // Clamp target agar tidak melebihi jangkauan lengan
        const maxReach = (L1 + L2) * 0.98;
        const minReach = Math.abs(L1 - L2) * 1.05;
        const clampedDist = Math.max(minReach, Math.min(dist, maxReach));

        // Law of Cosines untuk sudut siku (Lower arm angle relative to upper arm)
        const cosElbow = (L1 * L1 + L2 * L2 - clampedDist * clampedDist) / (2 * L1 * L2);
        const clampedCosElbow = Math.max(-1, Math.min(1, cosElbow));
        const elbowAngle = Math.PI - Math.acos(clampedCosElbow);

        // Sudut arah ke target
        const angleToTarget = Math.atan2(relTargetY, relTargetX);

        // Law of Cosines untuk sudut bahu
        const cosShoulder = (L1 * L1 + clampedDist * clampedDist - L2 * L2) / (2 * L1 * clampedDist);
        const clampedCosShoulder = Math.max(-1, Math.min(1, cosShoulder));
        const shoulderOffset = Math.acos(clampedCosShoulder);

        const isLeft = (side === 'left');
        const upperAngle = angleToTarget - Math.PI / 2 + (isLeft ? -shoulderOffset : shoulderOffset);
        const lowerAngle = (isLeft ? elbowAngle : -elbowAngle);

        const targetArmState = this[side === 'left' ? 'leftArmState' : 'rightArmState'];
        targetArmState.targetUpper = upperAngle;
        targetArmState.targetLower = lowerAngle;
    }

    /**
     * Pemicu Gerakan Sabetan Serangan (Battle Strike Gesture)
     */
    triggerAttack() {
        if (this.attackCooldown > 0) return false;
        this.attackCooldown = 0.4;
        this.isAttacking = true;

        // Ayunkan tangan ke depan dengan cepat
        this.rightArmState.targetUpper = this.facing > 0 ? 1.5 : -1.5;
        this.rightArmState.targetLower = 0.2;

        setTimeout(() => {
            this.rightArmState.targetUpper = -0.3;
            this.rightArmState.targetLower = -0.6;
            this.isAttacking = false;
        }, 220);

        return true;
    }

    /**
     * Render Wayang dengan Efek Bayangan Kelir
     */
    draw(ctx, isShadow = true) {
        WayangRenderer.drawPuppet(ctx, this, isShadow);
    }
}
