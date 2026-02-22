// 生物反応槽アニメーション制御
class BioReactionAnimation {
    constructor() {
        this.init();
    }

    init() {
        // 渦アニメーションの初期化
        this.initVortexAnimations();

        // 気泡アニメーションの初期化
        this.initBubbleAnimations();
    }
    
    initVortexAnimations() {
        // 無酸素槽の渦を生成（縦幅1.5倍）
        this.createVortexPath('vortex-path-1', 100, 50, 350, 80, 15, 12);
        
        // 嫌気槽の渦を生成（縦幅1.5倍）
        this.createVortexPath('vortex-path-2', 100, 50, 350, 80, 15, 12);
    }
    
    createVortexPath(pathId, cx, topY, bottomY, rTop, rBottom, turns) {
        const pathEl = document.getElementById(pathId);
        if (!pathEl) return;
        
        const pointsPerTurn = 60;
        const totalPoints = Math.max(50, Math.floor(pointsPerTurn * turns));
        const ySpan = bottomY - topY;
        
        let d = "";
        for (let i = 0; i <= totalPoints; i++) {
            const t = i / totalPoints;
            const y = topY + ySpan * t;
            const radius = rTop + (rBottom - rTop) * t;
            const theta = (turns * 2 * Math.PI) * t;
            const x = cx + Math.cos(theta) * radius;
            
            if (i === 0) {
                d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
            } else {
                d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
            }
        }
        
        pathEl.setAttribute("d", d);
    }
    
    initBubbleAnimations() {
        // 気泡アニメーション1を初期化
        this.createBubbleAnimation('bubble-canvas-1');
        
        // 気泡アニメーション2を初期化
        this.createBubbleAnimation('bubble-canvas-2');
    }
    
    createBubbleAnimation(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        const dpr = Math.max(1, devicePixelRatio || 1);

        // 設定
        const CFG = {
            spawnPerSec: 2.5,      // 秒あたり発生数
            baseSize: 4,           // 基準サイズ
            sizeVariation: 4,      // サイズばらつき
            wobbleAmp: 5,          // ふわふわ揺らぎの振幅
            wobbleFreq: 1.2,       // 揺らぎの周波数

            // 軌道の速度（進行度/秒）
            baseSpeed: 0.04,
            speedVariation: 0.03,

            // 外周エリアの定義（キャンバス比率）
            // 外側マージン（キャンバス端からの距離）
            marginTop: 0.05,
            marginBottom: 0.05,
            marginLeft: 0.05,
            marginRight: 0.10,
            // 内側空白エリア（中央の空白部分）
            innerTop: 0.25,
            innerBottom: 0.01,
            innerLeft: 0.20,
            innerRight: 0.20
        };

        class Bubble {
            constructor(t, initialProgress = 0) {
                this.init(t, initialProgress);
            }

            init(t, initialProgress = 0) {
                this.birth = t;
                this.progress = initialProgress;  // 0〜1で軌道上の位置
                this.dead = false;

                // 速度（泡ごとにばらつき）
                this.speed = CFG.baseSpeed + (Math.random() - 0.5) * CFG.speedVariation;

                // 外周のどの辺りを通るか（0=内側寄り、1=外側寄り）
                this.pathOffset = Math.random();

                // 泡のサイズ（0〜1の正規化値を保持）
                const sizeRatio = Math.random();
                this.r = CFG.baseSize + sizeRatio * CFG.sizeVariation;

                // 上昇速度は泡のサイズに比例（大きい泡＝浮力大＝速い）
                this.risingSpeedMultiplier = 1.2 + sizeRatio * 0.4;  // 1.2〜1.6倍

                // 揺らぎ用シード
                this.wobbleSeed = Math.random() * 1000;

                // 上昇時の広がり具合（泡ごとにランダム、0=まっすぐ、1=大きく広がる）
                this.spreadFactor = Math.random();

                // 位置とアルファ
                this.x = 0;
                this.y = 0;
                this.alpha = 1;
            }

            update(dt, t) {
                const W = canvas.width / dpr;
                const H = canvas.height / dpr;

                // 上昇フェーズ（Phase1）は速く、サイズに比例した速度
                const isRisingPhase = this.progress < 0.30;
                const speedMultiplier = isRisingPhase ? this.risingSpeedMultiplier : 1.0;

                // 進行度を更新
                this.progress += this.speed * dt * speedMultiplier;

                // 軌道の各区間の長さ（比率）
                // Phase1: 右辺上昇, Corner1: 右上角カーブ, Phase2: 上辺左移動, Corner2: 左上角カーブ, Phase3: 左辺下降
                const phase1Ratio = 0.30;   // 右辺（上昇）
                const corner1Ratio = 0.08;  // 右上角カーブ
                const phase2Ratio = 0.27;   // 上辺（左移動）
                const corner2Ratio = 0.08;  // 左上角カーブ
                const phase3Ratio = 0.27;   // 左辺（下降+フェードアウト）

                // 外周の境界を計算
                const outerLeft = W * CFG.marginLeft;
                const outerRight = W * (1 - CFG.marginRight);
                const outerTop = H * CFG.marginTop;
                const outerBottom = H * (1 - CFG.marginBottom);

                const innerLeft = W * CFG.innerLeft;
                const innerRight = W * (1 - CFG.innerRight);
                const innerTop = H * CFG.innerTop;
                const innerBottom = H * (1 - CFG.innerBottom);

                // pathOffsetに基づいて通る位置を決定
                const rightX = innerRight + (outerRight - innerRight) * this.pathOffset;
                const leftX = outerLeft + (innerLeft - outerLeft) * this.pathOffset;
                const topY = outerTop + (innerTop - outerTop) * this.pathOffset;
                const bottomY = innerBottom + (outerBottom - innerBottom) * this.pathOffset;

                let x, y;
                const p = this.progress;

                // Phase1終了時の広がり量（泡ごとに異なる）
                const maxSpreadAmount = (rightX - leftX) * 0.2 * this.spreadFactor;
                // Phase1終了時のX座標
                const phase1EndX = rightX - maxSpreadAmount;

                const p1End = phase1Ratio;
                const c1End = p1End + corner1Ratio;
                const p2End = c1End + phase2Ratio;
                const c2End = p2End + corner2Ratio;

                // Phase1は上端の少し手前（90%）まで上昇し、Corner1で残りを上昇しながらカーブ
                const phase1TopY = topY + (bottomY - topY) * 0.1;  // 上端の90%まで

                if (p < p1End) {
                    // Phase 1: 右辺を上昇（右下 → 右上手前）ふんわり左に広がりながら
                    const localP = p / phase1Ratio;
                    // 上昇しながら徐々に左に広がる（ease-out風）
                    const spreadProgress = 1 - Math.pow(1 - localP, 2);
                    const spreadAmount = maxSpreadAmount * spreadProgress;
                    x = rightX - spreadAmount;
                    y = bottomY - (bottomY - phase1TopY) * localP;
                    this.alpha = 1;
                } else if (p < c1End) {
                    // Corner 1: 右上角をカーブ（残りの上昇 + 左への移動開始）
                    const localP = (p - p1End) / corner1Ratio;
                    const curveP = Math.sin(localP * Math.PI / 2);  // ease-in-out風
                    x = phase1EndX - (phase1EndX - leftX) * curveP * 0.15;
                    // 残りの上昇をしながらカーブ
                    y = phase1TopY - (phase1TopY - topY) * curveP;
                    this.alpha = 1;
                } else if (p < p2End) {
                    // Phase 2: 上辺を左へ（右上 → 左上手前）
                    const localP = (p - c1End) / phase2Ratio;
                    const startX = phase1EndX - (phase1EndX - leftX) * 0.15;
                    const endX = leftX + (phase1EndX - leftX) * 0.15;
                    x = startX - (startX - endX) * localP;
                    y = topY;
                    this.alpha = 1;
                } else if (p < c2End) {
                    // Corner 2: 左上角をカーブ
                    const localP = (p - p2End) / corner2Ratio;
                    const curveP = Math.sin(localP * Math.PI / 2);
                    const cornerStartX = leftX + (phase1EndX - leftX) * 0.15;
                    x = cornerStartX - (cornerStartX - leftX) * curveP;
                    y = topY + (bottomY - topY) * localP * 0.08;
                    this.alpha = 1;
                } else if (p < 1) {
                    // Phase 3: 左辺を下降（左上 → 左下）+ フェードアウト
                    const localP = (p - c2End) / phase3Ratio;
                    const startY = topY + (bottomY - topY) * 0.08;
                    x = leftX;
                    y = startY + (bottomY - startY) * localP;
                    // フェードアウト（後半でより急速に）
                    this.alpha = Math.max(0, 1 - Math.pow(localP, 0.7));
                } else {
                    // 軌道完了
                    this.dead = true;
                    return;
                }

                // ふわふわ揺らぎを追加
                const wobbleX = Math.sin(this.wobbleSeed + t * CFG.wobbleFreq) * CFG.wobbleAmp;
                const wobbleY = Math.cos(this.wobbleSeed * 1.3 + t * CFG.wobbleFreq * 0.8) * CFG.wobbleAmp * 0.7;

                this.x = x + wobbleX;
                this.y = y + wobbleY;
            }

            draw() {
                if (this.dead || this.alpha <= 0.01) return;
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(173, 216, 230, 0.85)';
                ctx.fill();
                // 白い縁取り
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        let bubbles = [];
        let spawnCarry = 0;

        function resize() {
            const r = canvas.getBoundingClientRect();
            const W = Math.max(50, Math.floor(r.width * dpr));
            const H = Math.max(100, Math.floor(r.height * dpr));
            canvas.width = W;
            canvas.height = H;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resize();
        window.addEventListener('resize', resize, { passive: true });

        // 初期の気泡を軌道上に分散配置
        const t0 = performance.now() / 1000;
        for (let i = 0; i < 20; i++) {
            // Phase1とPhase2の範囲に分散（0〜0.7）
            const initialProgress = Math.random() * 0.65;
            bubbles.push(new Bubble(t0, initialProgress));
        }

        let prev = performance.now() / 1000;

        function loop() {
            const now = performance.now() / 1000;
            const dt = Math.min(0.05, now - prev);
            prev = now;

            // 死んだ泡を除去
            bubbles = bubbles.filter(b => !b.dead);

            // 新しい泡を右下から発生
            spawnCarry += CFG.spawnPerSec * dt;
            while (spawnCarry >= 1) {
                bubbles.push(new Bubble(now, 0));
                spawnCarry -= 1;
            }

            // 泡の数を制限
            if (bubbles.length > 50) {
                bubbles.splice(0, bubbles.length - 50);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 更新と描画
            for (const b of bubbles) {
                b.update(dt, now);
                b.draw();
            }

            requestAnimationFrame(loop);
        }

        loop();
    }
}

// DOM読み込み完了後にアニメーション開始
document.addEventListener('DOMContentLoaded', () => {
    new BioReactionAnimation();
});