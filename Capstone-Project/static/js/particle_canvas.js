/**
 * LeadFlow AI — Dynamic Canvas Background Engine
 * Mode 1: Halftone Radial Grid (Welcome / Landing Page)
 * Mode 2: 3D Undulating Emerald Particle Wave (Logged-In Dashboard Pages)
 */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvasEngine);
} else {
    initCanvasEngine();
}

function initCanvasEngine() {
    let canvas = document.getElementById('leadflow-bg-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'leadflow-bg-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        document.body.insertBefore(canvas, document.body.firstChild);
    }

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const isLanding = document.body.classList.contains('page-landing') || document.body.classList.contains('no-sidebar');

    if (isLanding) {
        runHalftoneGrid(canvas, ctx);
    } else {
        runUndulatingWaveGrid(canvas, ctx);
    }
}

/**
 * MODE 1: Halftone Emerald Ray Grid (Welcome Page - Soft Elegant Ambient Halftone)
 */
function runHalftoneGrid(canvas, ctx) {
    let count = 0;

    function render() {
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#05070D';
        ctx.fillRect(0, 0, width, height);

        const SPACING = 36;
        const cols = Math.floor(width / SPACING);
        const rows = Math.floor(height / SPACING);
        count += 0.015;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * SPACING + 18;
                const y = r * SPACING + 18;

                const distFromDiagonal = (c * 0.8 - r * 0.5) / 1.5;
                const wave = Math.sin(distFromDiagonal * 0.3 - count);

                if (wave > -0.3) {
                    const radius = Math.max(0.8, (wave + 0.3) * 2.8);
                    const alpha = Math.min(0.55, Math.max(0.04, (wave + 0.3) * 0.5));

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);

                    if (wave > 0.6) {
                        ctx.fillStyle = `rgba(62, 207, 142, ${alpha})`;
                    } else if (wave > 0.1) {
                        ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.7})`;
                    } else {
                        ctx.fillStyle = `rgba(56, 152, 236, ${alpha * 0.35})`;
                    }

                    ctx.fill();
                }
            }
        }

        requestAnimationFrame(render);
    }

    render();
}

/**
 * MODE 2: 3D Undulating Emerald Particle Wave (Logged-In Dashboard Pages)
 */
let isCanvasPaused = false;
window.pauseCanvas = () => { isCanvasPaused = true; };
window.resumeCanvas = () => { isCanvasPaused = false; };

function runUndulatingWaveGrid(canvas, ctx) {
    let count = 0;
    const isGraphPage = document.body.classList.contains('page-graph');

    function render() {
        if (isCanvasPaused) {
            requestAnimationFrame(render);
            return;
        }

        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#05070D';
        ctx.fillRect(0, 0, width, height);

        const SEPARATION = isGraphPage ? 48 : 38;
        const gridWidthNeeded = width * 1.2;
        const AMOUNTX = Math.ceil(gridWidthNeeded / SEPARATION);
        const AMOUNTY = isGraphPage ? 25 : 35;

        const focalLength = 380;
        const centerX = width / 2;
        const centerY = height * 0.92;

        count += 0.025;

        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                const x3D = (ix - AMOUNTX / 2) * SEPARATION;
                const z3D = iy * SEPARATION + 70;

                const y3D = (Math.sin((ix + count) * 0.22) * 16) + (Math.sin((iy + count) * 0.18) * 16);

                const scale = focalLength / (focalLength + z3D);
                const x2D = centerX + x3D * scale;
                const y2D = centerY + (y3D + 25) * scale;

                if (x2D < -20 || x2D > width + 20) continue;

                const radius = Math.max(0.7, scale * 3.5);
                const depthAlpha = Math.max(0.04, 1 - (z3D / (AMOUNTY * SEPARATION)));
                
                ctx.beginPath();
                ctx.arc(x2D, y2D, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(62, 207, 142, ${depthAlpha * 0.75})`;
                ctx.fill();
            }
        }

        requestAnimationFrame(render);
    }

    render();
}
