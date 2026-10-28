/* ==========================================================================
   WAYANG DIGITAL - HAND TRACKER ENGINE (MediaPipe AI Hand Pose Integration)
   Real-time 60fps tracking, smoothing filters, gesture recognition & fallback
   ========================================================================== */

export class HandTracker {
    constructor(videoElement, canvasDebugElement, onHandsDetectedCallback) {
        this.video = videoElement;
        this.debugCanvas = canvasDebugElement;
        this.debugCtx = canvasDebugElement ? canvasDebugElement.getContext('2d') : null;
        this.onHandsDetected = onHandsDetectedCallback;

        this.hands = null;
        this.camera = null;
        this.isRunning = false;
        this.isMirrored = true;
        this.showDebugSkeleton = true;

        // Smoothing state (EMA filter for low-latency jitter suppression)
        this.smoothingFactor = 0.35; // 0 = stiff, 1 = raw jitter
        this.smoothedHands = [];

        // Gesture state
        this.lastPinchTime = { left: 0, right: 0 };
    }

    async init() {
        // Cek ketersediaan MediaPipe di window (di-load via CDN script di HTML)
        if (typeof window.Hands === 'undefined') {
            console.warn("MediaPipe Hands library not loaded yet. Waiting...");
            await this.waitForMediaPipe();
        }

        try {
            this.hands = new window.Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.55,
                minTrackingConfidence: 0.55
            });

            this.hands.onResults((results) => this.processResults(results));
            return true;
        } catch (err) {
            console.error("Failed to initialize MediaPipe Hands:", err);
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
            }, 5000);
        });
    }

    async startCamera() {
        if (this.isRunning) return true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.video.srcObject = stream;
            await new Promise((res) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    res();
                };
            });

            if (typeof window.Camera !== 'undefined') {
                this.camera = new window.Camera(this.video, {
                    onFrame: async () => {
                        if (this.hands && this.isRunning) {
                            await this.hands.send({ image: this.video });
                        }
                    },
                    width: 640,
                    height: 480
                });
                this.camera.start();
            } else {
                // Manual animation frame loop
                this.runManualFrameLoop();
            }

            this.isRunning = true;
            return true;
        } catch (error) {
            console.error("Error accessing webcam:", error);
            return false;
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

    stopCamera() {
        this.isRunning = false;
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    /**
     * Memproses Hasil Landmark dari MediaPipe
     */
    processResults(results) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            if (this.onHandsDetected) {
                this.onHandsDetected([]);
            }
            this.renderDebug(null);
            return;
        }

        const detectedHands = [];

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const rawLandmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness && results.multiHandedness[i] 
                ? results.multiHandedness[i].label 
                : (i === 0 ? 'Left' : 'Right');

            // Apply Mirroring if enabled
            const landmarks = rawLandmarks.map(lm => ({
                x: this.isMirrored ? (1.0 - lm.x) : lm.x,
                y: lm.y,
                z: lm.z
            }));

            // Key Landmarks
            const wrist = landmarks[0];
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const pinkyTip = landmarks[20];

            // 1. Pinch Gesture (Dalang Nyempurit / Attack Trigger)
            const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
            const isPinching = pinchDist < 0.075;

            // 2. Hand Open / Fist Span
            const spanDist = Math.hypot(thumbTip.x - pinkyTip.x, thumbTip.y - pinkyTip.y);

            // 3. Hand Tilt Angle
            const handAngle = Math.atan2(middleTip.y - wrist.y, middleTip.x - wrist.x);

            // 4. Arm reach vector (relative to wrist)
            const relArmX = (indexTip.x - wrist.x) * 400;
            const relArmY = (indexTip.y - wrist.y) * 400;

            detectedHands.push({
                index: i,
                label: handedness, // 'Left' or 'Right'
                landmarks: landmarks,
                wrist: wrist,
                indexTip: indexTip,
                middleTip: middleTip,
                thumbTip: thumbTip,
                handAngle: handAngle,
                isPinching: isPinching,
                spanDist: spanDist,
                relArmX: relArmX,
                relArmY: relArmY
            });
        }

        // Apply EMA Smoothing
        this.smoothedHands = this.applySmoothing(detectedHands);

        if (this.onHandsDetected) {
            this.onHandsDetected(this.smoothedHands);
        }

        this.renderDebug(results);
    }

    applySmoothing(currentHands) {
        if (!this.smoothedHands || this.smoothedHands.length === 0) {
            return currentHands;
        }

        return currentHands.map(h => {
            const prev = this.smoothedHands.find(p => p.label === h.label) || h;
            const alpha = this.smoothingFactor;

            return {
                ...h,
                wrist: {
                    x: prev.wrist.x * (1 - alpha) + h.wrist.x * alpha,
                    y: prev.wrist.y * (1 - alpha) + h.wrist.y * alpha,
                    z: prev.wrist.z * (1 - alpha) + h.wrist.z * alpha
                },
                handAngle: prev.handAngle * (1 - alpha) + h.handAngle * alpha,
                relArmX: prev.relArmX * (1 - alpha) + h.relArmX * alpha,
                relArmY: prev.relArmY * (1 - alpha) + h.relArmY * alpha
            };
        });
    }

    /**
     * Render Debug Visual Skeleton di pojok HUD Dalang
     */
    renderDebug(results) {
        if (!this.debugCtx || !this.showDebugSkeleton) return;
        const ctx = this.debugCtx;
        const w = this.debugCanvas.width;
        const h = this.debugCanvas.height;

        ctx.clearRect(0, 0, w, h);

        if (!results || !results.multiHandLandmarks) return;

        // Connections definition for hand skeleton
        const CONNECTIONS = [
            [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],       // Index
            [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
            [9, 13], [13, 14], [14, 15], [15, 16],// Ring
            [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
            [0, 17]                               // Palm base
        ];

        results.multiHandLandmarks.forEach((landmarks, idx) => {
            const isLeft = idx === 0;
            ctx.strokeStyle = isLeft ? '#00e5ff' : '#ff9100';
            ctx.lineWidth = 2.5;

            // Draw Lines
            CONNECTIONS.forEach(([start, end]) => {
                const p1 = landmarks[start];
                const p2 = landmarks[end];
                const x1 = this.isMirrored ? (1 - p1.x) * w : p1.x * w;
                const y1 = p1.y * h;
                const x2 = this.isMirrored ? (1 - p2.x) * w : p2.x * w;
                const y2 = p2.y * h;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            });

            // Draw Joint Points
            landmarks.forEach((p, pIdx) => {
                const px = this.isMirrored ? (1 - p.x) * w : p.x * w;
                const py = p.y * h;

                ctx.fillStyle = (pIdx === 4 || pIdx === 8) ? '#ffd700' : '#ffffff';
                ctx.beginPath();
                ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }
}
