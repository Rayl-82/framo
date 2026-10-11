/**
 * FRAMO — Elegant 4-Cut Photobooth Web Prototype
 * script.js — Shared interactions, webcam capture engine & Canvas renderer
 */

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

const FRAMES_CONFIG = {
  'classic-burgundy': {
    id: 'classic-burgundy',
    name: 'Classic Burgundy',
    subtitle: 'Timeless editorial warmth with refined gold and cream accents',
    bgColor: '#781B28',
    cardBg: '#781B28',
    photoBorder: 'rgba(248, 243, 233, 0.4)',
    textColor: '#F8F3E9',
    subtextColor: '#C5A66A',
    accentColor: '#C5A66A',
    tag: 'SIGNATURE'
  },
  'car-free-day': {
    id: 'car-free-day',
    name: 'Car Free Day',
    subtitle: 'Urban morning run club with pace counter, km markers & barcode',
    overlaySrc: 'assets/Car-Free-Day-Frame.png',
    bgColor: '#1E1E24',
    windows: [
      { x: 127, y: 202, w: 467, h: 364 },
      { x: 127, y: 603, w: 467, h: 363 },
      { x: 127, y: 1004, w: 467, h: 363 },
      { x: 127, y: 1404, w: 467, h: 364 }
    ],
    canvasWidth: 724,
    canvasHeight: 2172,
    tag: 'SPORTS & CFD'
  },
  'world-cup-26': {
    id: 'world-cup-26',
    name: "World Cup '26",
    subtitle: 'Official North America summer tournament edition with trophy & stamps',
    overlaySrc: 'assets/World-Cup-Frame.png',
    bgColor: '#F8F3E9',
    windows: [
      { x: 137, y: 333, w: 438, h: 333 },
      { x: 137, y: 711, w: 452, h: 352 },
      { x: 137, y: 1109, w: 452, h: 352 },
      { x: 143, y: 1506, w: 420, h: 333 }
    ],
    canvasWidth: 724,
    canvasHeight: 2172,
    tag: 'TOURNAMENT'
  },
  'photobooth-memories': {
    id: 'photobooth-memories',
    name: 'Photo Memories',
    subtitle: 'Cute vintage Korean aesthetic with ribbons, stamps & coffee cup',
    overlaySrc: 'assets/Vintage-Green-Photobooth-Memories-Frame.png',
    bgColor: '#F8F3E9',
    windows: [
      { x: 211, y: 122, w: 517, h: 282 },
      { x: 211, y: 450, w: 517, h: 282 },
      { x: 211, y: 779, w: 517, h: 282 },
      { x: 211, y: 1108, w: 517, h: 281 }
    ],
    canvasWidth: 941,
    canvasHeight: 1672,
    tag: 'CUTE VINTAGE'
  },
  'sunday-morning': {
    id: 'sunday-morning',
    name: 'Sunday Morning',
    subtitle: 'Quiet ivory mat, warm taupe typography, and natural morning light',
    bgColor: '#F8F3E9',
    cardBg: '#FFFDF8',
    photoBorder: 'rgba(61, 45, 40, 0.12)',
    textColor: '#3D2D28',
    subtextColor: '#947B65',
    accentColor: '#781B28',
    tag: 'MINIMAL'
  },
  'film-memories': {
    id: 'film-memories',
    name: 'Film Memories',
    subtitle: '35mm analog aesthetics with retro orange LED date stamp and film codes',
    bgColor: '#201A18',
    cardBg: '#201A18',
    photoBorder: 'rgba(255, 255, 255, 0.15)',
    textColor: '#F8F3E9',
    subtextColor: '#E07A5F',
    accentColor: '#C5A66A',
    tag: 'VINTAGE'
  }
};

// Backwards compatibility alias for cfd-edition
FRAMES_CONFIG['cfd-edition'] = FRAMES_CONFIG['car-free-day'];

const SAMPLE_PHOTOS = [
  'assets/sample-1.jpg',
  'assets/sample-2.jpg',
  'assets/sample-3.jpg',
  'assets/sample-4.jpg'
];

// ============================================================================
// 2. WEB AUDIO SYNTHESIZER (Camera Shutter & Countdown Beep)
// ============================================================================

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeep(freq = 600, duration = 0.08) {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors gracefully
  }
}

function playShutterSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    // Layer 1: high click
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.08);

    // Layer 2: mechanical snap
    setTimeout(() => {
      if (!audioCtx) return;
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.06);
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.06);
    }, 45);
  } catch (e) {
    // Ignore audio errors
  }
}

// ============================================================================
// 3. STORAGE & STATE HELPERS
// ============================================================================

function getStoredFrame() {
  return sessionStorage.getItem('framo_selected_frame') || 'classic-burgundy';
}

function setStoredFrame(frameId) {
  if (FRAMES_CONFIG[frameId]) {
    sessionStorage.setItem('framo_selected_frame', frameId);
  }
}

function formatDateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return {
    iso: `${year}.${month}.${day}`,
    time: `${hours}:${minutes}`,
    retroDate: `'${String(year).slice(-2)} ${month} ${day}`,
    full: `${month}/${day}/${year} ${hours}:${minutes}`
  };
}

// ============================================================================
// 4. CANVAS PHOTO STRIP RENDER ENGINE
// ============================================================================

/**
 * Composes 4 captured photos into a high-res photo strip on an HTML Canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {Array<string|HTMLImageElement|ImageBitmap>} photoSources - 4 images
 * @param {string} frameId - 'classic-burgundy' | 'sunday-morning' | 'cfd-edition' | 'film-memories'
 * @returns {Promise<void>}
 */
async function renderStripOnCanvas(canvas, photoSources, frameId = 'classic-burgundy') {
  if (!canvas || !photoSources || photoSources.length < 4) return;
  const ctx = canvas.getContext('2d');
  const frame = FRAMES_CONFIG[frameId] || FRAMES_CONFIG['classic-burgundy'];

  // High-resolution canvas dimensions (1000 x 3000 px: crisp 1:3 photobooth ratio)
  const W = 1000;
  const H = 3000;
  canvas.width = W;
  canvas.height = H;

  // Preload all 4 images
  const loadedImages = await Promise.all(
    photoSources.slice(0, 4).map(src => {
      return new Promise((resolve, reject) => {
        if (src instanceof HTMLImageElement && src.complete) {
          resolve(src);
        } else if (typeof src === 'string') {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => {
            // Fallback placeholder
            const fallback = new Image();
            fallback.src = SAMPLE_PHOTOS[0];
            fallback.onload = () => resolve(fallback);
          };
          img.src = src;
        } else {
          resolve(src);
        }
      });
    })
  );

  // =========================================================================
  // IMAGE OVERLAY FRAME RENDERER (e.g. Car Free Day, World Cup, Vintage Cute)
  // =========================================================================
  if (frame.overlaySrc) {
    const W = frame.canvasWidth || 724;
    const H = frame.canvasHeight || 2172;
    canvas.width = W;
    canvas.height = H;

    // Fill background
    ctx.fillStyle = frame.bgColor || '#F8F3E9';
    ctx.fillRect(0, 0, W, H);

    // Load overlay image
    const overlayImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = frame.overlaySrc;
    });

    // Helper to draw an image maintaining aspect ratio (cover crop)
    function drawCoverWindow(img, dx, dy, dw, dh) {
      const sw = img.width || dw;
      const sh = img.height || dh;
      const imgRatio = sw / sh;
      const targetRatio = dw / dh;
      let sx, sy, sWidth, sHeight;

      if (imgRatio > targetRatio) {
        sHeight = sh;
        sWidth = sh * targetRatio;
        sx = (sw - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = sw;
        sHeight = sw / targetRatio;
        sx = 0;
        sy = (sh - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
    }

    // Draw the 4 photos under their window slots
    for (let i = 0; i < 4; i++) {
      const win = frame.windows ? frame.windows[i] : null;
      const img = loadedImages[i];
      if (win && img) {
        ctx.save();
        // 3px bleed to ensure seamless border contact
        const bleed = 3;
        drawCoverWindow(img, win.x - bleed, win.y - bleed, win.w + bleed * 2, win.h + bleed * 2);
        ctx.restore();
      }
    }

    // Draw the graphic frame overlay on top
    if (overlayImg) {
      ctx.drawImage(overlayImg, 0, 0, W, H);
    }
    return;
  }

  // =========================================================================
  // PROCEDURAL CANVAS FRAME RENDERER (Classic Burgundy, Sunday Morning, etc.)
  // =========================================================================
  // Background Fill
  ctx.fillStyle = frame.bgColor;
  ctx.fillRect(0, 0, W, H);

  // Layout math
  const marginX = 80;
  const photoW = W - marginX * 2; // 840px
  const photoH = 560; // 3:2 aspect ratio (840 x 560)
  const gap = 36;
  const startY = 80;

  // Helper to draw an image maintaining aspect ratio (cover crop)
  function drawCoverImage(img, dx, dy, dw, dh) {
    const sw = img.width || dw;
    const sh = img.height || dh;
    const imgRatio = sw / sh;
    const targetRatio = dw / dh;
    let sx, sy, sWidth, sHeight;

    if (imgRatio > targetRatio) {
      sHeight = sh;
      sWidth = sh * targetRatio;
      sx = (sw - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = sw;
      sHeight = sw / targetRatio;
      sx = 0;
      sy = (sh - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
  }

  // Draw specific frame accents before/under photos
  if (frameId === 'sunday-morning') {
    // Soft card mat layer
    ctx.fillStyle = frame.cardBg;
    ctx.fillRect(40, 40, W - 80, H - 80);
    ctx.strokeStyle = 'rgba(61, 45, 40, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, W - 80, H - 80);
  }

  // Draw 4 photos
  for (let i = 0; i < 4; i++) {
    const curY = startY + i * (photoH + gap);
    const img = loadedImages[i];

    // Photo shadow (subtle)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(marginX, curY, photoW, photoH);
    ctx.restore();

    // Clip & Draw photo
    ctx.save();
    ctx.beginPath();
    ctx.rect(marginX, curY, photoW, photoH);
    ctx.clip();
    drawCoverImage(img, marginX, curY, photoW, photoH);

    // Subtle film tone overlay for Film Memories
    if (frameId === 'film-memories') {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.04)'; // warm analog tint
      ctx.fillRect(marginX, curY, photoW, photoH);
    }
    ctx.restore();

    // Photo borders
    ctx.strokeStyle = frame.photoBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(marginX, curY, photoW, photoH);

    // Frame-specific per-photo decorations
    if (frameId === 'classic-burgundy') {
      // Small gold frame counter pill in photo corner
      ctx.fillStyle = 'rgba(120, 27, 40, 0.75)';
      ctx.fillRect(marginX + 20, curY + 20, 44, 26);
      ctx.fillStyle = '#F8F3E9';
      ctx.font = '500 13px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`0${i + 1}`, marginX + 42, curY + 38);
    } else if (frameId === 'cfd-edition') {
      // Corner technical markers & frame number
      ctx.fillStyle = 'rgba(248, 243, 233, 0.7)';
      ctx.font = '500 12px "Outfit", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`+ FRAME 0${i + 1} / 04`, marginX + 16, curY - 10);

      // Small crosshairs
      ctx.strokeStyle = 'rgba(248, 243, 233, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX - 10, curY + 10);
      ctx.lineTo(marginX - 2, curY + 10);
      ctx.stroke();
    } else if (frameId === 'film-memories') {
      // 35mm film edge marking
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '600 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`FRAMO 400`, marginX + 10, curY - 10);
      ctx.textAlign = 'right';
      ctx.fillText(`▶ ${20 + i}A`, marginX + photoW - 10, curY - 10);

      // Sprocket simulation ticks along side margin
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let s = 0; s < 4; s++) {
        const spY = curY + 30 + s * 130;
        ctx.fillRect(marginX - 38, spY, 18, 28);
        ctx.fillRect(marginX + photoW + 20, spY, 18, 28);
      }
    }
  }

  // ==========================================
  // FOOTER & BRANDING AREA
  // ==========================================
  const footerStartY = startY + 4 * photoH + 3 * gap + 40; // ~2540px
  const dateInfo = formatDateStamp();

  if (frameId === 'classic-burgundy') {
    // Divider line
    ctx.strokeStyle = 'rgba(197, 166, 106, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, footerStartY);
    ctx.lineTo(marginX + photoW, footerStartY);
    ctx.stroke();

    // Primary Brand Wordmark
    ctx.fillStyle = '#F8F3E9';
    ctx.font = '600 78px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('framo.', W / 2, footerStartY + 110);

    // Tagline
    ctx.fillStyle = '#C5A66A';
    ctx.font = '400 20px "Outfit", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('TURN EVERY MOMENT INTO FRAMES.', W / 2, footerStartY + 160);

    // Editorial details row
    ctx.fillStyle = 'rgba(248, 243, 233, 0.6)';
    ctx.font = '300 15px "Outfit", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.textAlign = 'left';
    ctx.fillText(`SEOUL // CLASSIC EDITION`, marginX, footerStartY + 230);
    ctx.textAlign = 'right';
    ctx.fillText(`${dateInfo.iso} • ${dateInfo.time}`, marginX + photoW, footerStartY + 230);

    // Delicate star symbol in center
    ctx.textAlign = 'center';
    ctx.fillStyle = '#C5A66A';
    ctx.font = '16px "Cormorant Garamond", serif';
    ctx.fillText('✦   ✦   ✦', W / 2, footerStartY + 230);

  } else if (frameId === 'sunday-morning') {
    // Elegant minimal editorial
    ctx.strokeStyle = 'rgba(61, 45, 40, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX + 60, footerStartY);
    ctx.lineTo(marginX + photoW - 60, footerStartY);
    ctx.stroke();

    // Serif Italic headline
    ctx.fillStyle = '#3D2D28';
    ctx.font = 'italic 500 52px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sunday Morning Memories', W / 2, footerStartY + 90);

    // Brand wordmark
    ctx.fillStyle = '#781B28';
    ctx.font = '600 42px "Cormorant Garamond", serif';
    ctx.fillText('framo.', W / 2, footerStartY + 155);

    // Subtle caption
    ctx.fillStyle = '#947B65';
    ctx.font = '300 16px "Outfit", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('FOUR QUIET FRAMES  •  CAFE & STUDIO', W / 2, footerStartY + 195);

    ctx.fillStyle = 'rgba(61, 45, 40, 0.5)';
    ctx.font = '400 14px "Outfit", sans-serif';
    ctx.fillText(`${dateInfo.iso}  —  SESSION #2026`, W / 2, footerStartY + 235);

  } else if (frameId === 'cfd-edition') {
    // High-contrast modern street editorial
    ctx.fillStyle = '#F8F3E9';
    ctx.font = '700 70px "Cormorant Garamond", serif';
    ctx.textAlign = 'left';
    ctx.fillText('framo.', marginX, footerStartY + 90);

    ctx.fillStyle = '#781B28';
    ctx.font = '700 16px "Outfit", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('CAR FREE DAY / SPECIAL EDITION', marginX, footerStartY + 130);

    // Monospace technical coordinates & metadata
    ctx.fillStyle = 'rgba(248, 243, 233, 0.6)';
    ctx.font = '400 13px monospace';
    ctx.fillText(`LOC: 37°33'59"N 126°58'40"E // 4-CUT STUDIO`, marginX, footerStartY + 165);
    ctx.fillText(`TIME: ${dateInfo.iso} @ ${dateInfo.time} HRS`, marginX, footerStartY + 190);

    // Barcode drawing on right
    const barcodeX = marginX + photoW - 200;
    const barcodeY = footerStartY + 50;
    const barcodeW = 200;
    const barcodeH = 50;
    ctx.fillStyle = '#F8F3E9';
    const barPattern = [3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 2, 1, 3, 4, 1, 2, 3];
    let curBx = barcodeX;
    for (let b = 0; b < barPattern.length && curBx < barcodeX + barcodeW; b++) {
      const bw = barPattern[b];
      if (b % 2 === 0) {
        ctx.fillRect(curBx, barcodeY, bw, barcodeH);
      }
      curBx += bw + 2;
    }
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('FRM-2026-CFD', marginX + photoW, barcodeY + barcodeH + 20);

  } else if (frameId === 'film-memories') {
    // Retro Analog 35mm
    ctx.fillStyle = '#F8F3E9';
    ctx.font = '600 68px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('framo.', W / 2, footerStartY + 85);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '400 14px "Outfit", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('ANALOG EMULSION // 400 ISO', W / 2, footerStartY + 125);

    // Iconic Orange 7-Segment style LED Date Imprint
    ctx.fillStyle = '#E07A5F'; // Warm vintage amber/orange
    ctx.font = '700 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dateInfo.retroDate, W / 2, footerStartY + 190);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '300 13px "Outfit", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('KEEP THIS FRAME SAFE', W / 2, footerStartY + 235);
  }
}

// ============================================================================
// 5. PHOTOBOOTH STUDIO CONTROLLER CLASS
// ============================================================================

class FramoStudio {
  constructor() {
    // DOM Elements
    this.videoEl = document.getElementById('camera-stream');
    this.viewfinderBox = document.getElementById('viewfinder-box');
    this.viewfinderStatus = document.getElementById('viewfinder-status');
    this.cameraOverlay = document.getElementById('camera-overlay');
    this.countdownDisplay = document.getElementById('countdown-display');
    this.countdownNumber = document.getElementById('countdown-number');
    this.flashOverlay = document.getElementById('flash-overlay');
    this.posePrompt = document.getElementById('pose-prompt');
    this.cameraSwitchBtn = document.getElementById('camera-switch-btn');
    this.startSessionBtn = document.getElementById('start-session-btn');
    this.cancelSessionBtn = document.getElementById('cancel-session-btn');
    this.sampleFallbackBtn = document.getElementById('sample-fallback-btn');

    // Panels & Views
    this.setupPanel = document.getElementById('setup-panel');
    this.captureStripPreview = document.getElementById('capture-strip-preview');
    this.resultPanel = document.getElementById('result-panel');
    this.mainStudioView = document.getElementById('main-studio-view');
    this.finalStripCanvas = document.getElementById('final-strip-canvas');
    this.printArea = document.getElementById('print-area');
    this.printCanvas = document.getElementById('print-canvas');

    // Controls
    this.frameSelectors = document.querySelectorAll('.frame-selector-btn');
    this.downloadBtn = document.getElementById('download-btn');
    this.printBtn = document.getElementById('print-btn');
    this.retakeBtn = document.getElementById('retake-btn');

    // Modals & alerts
    this.cameraAlert = document.getElementById('camera-alert');
    this.phoneModal = document.getElementById('phone-modal');

    // State
    this.stream = null;
    this.devices = [];
    this.currentDeviceIndex = 0;
    this.facingMode = 'user'; // 'user' or 'environment'
    this.isCapturing = false;
    this.currentShotIndex = 0;
    this.capturedPhotos = []; // array of data URLs / canvas blobs
    this.selectedFrame = getStoredFrame();
    this.useSampleMode = false;

    // Pose guidelines
    this.poseTips = [
      'Pose 1 / 4 — Soft smile & close friends',
      'Pose 2 / 4 — Candid laughter or peace sign ✌️',
      'Pose 3 / 4 — Head tilt or favorite expression',
      'Pose 4 / 4 — Silly, joyful, or big smile! ✨'
    ];
  }

  init() {
    this.setupEventListeners();
    this.highlightActiveFrame(this.selectedFrame);

    // Check query params if any
    const params = new URLSearchParams(window.location.search);
    if (params.get('frame')) {
      const f = params.get('frame');
      if (FRAMES_CONFIG[f]) {
        this.selectedFrame = f;
        setStoredFrame(f);
        this.highlightActiveFrame(f);
      }
    }

    // Auto-init camera preview on page load
    this.initCamera();
  }

  setupEventListeners() {
    // Start session
    if (this.startSessionBtn) {
      this.startSessionBtn.addEventListener('click', () => this.startCaptureSequence());
    }

    // Cancel session
    if (this.cancelSessionBtn) {
      this.cancelSessionBtn.addEventListener('click', () => this.cancelSession());
    }

    // Camera switch (front/back)
    if (this.cameraSwitchBtn) {
      this.cameraSwitchBtn.addEventListener('click', () => this.switchCamera());
    }

    // Fallback sample photos button
    if (this.sampleFallbackBtn) {
      this.sampleFallbackBtn.addEventListener('click', () => this.useSamplePhotos());
    }

    // Frame selectors (all buttons with .frame-selector-btn)
    this.frameSelectors.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const frameId = btn.getAttribute('data-frame-id');
        if (frameId && FRAMES_CONFIG[frameId]) {
          this.selectedFrame = frameId;
          setStoredFrame(frameId);
          this.highlightActiveFrame(frameId);
          // If already in results view, immediately redraw canvas!
          if (this.capturedPhotos.length === 4) {
            this.composeFinalStrip();
          }
        }
      });
    });

    // Download action
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadStrip());
    }

    // Print action
    if (this.printBtn) {
      this.printBtn.addEventListener('click', () => this.printStrip());
    }

    // Retake session
    if (this.retakeBtn) {
      this.retakeBtn.addEventListener('click', () => this.retakeSession());
    }

    // Phone modal handlers
    const phoneModeBtn = document.getElementById('phone-mode-btn');
    const closePhoneModalBtn = document.getElementById('close-phone-modal-btn');
    if (phoneModeBtn && this.phoneModal) {
      phoneModeBtn.addEventListener('click', () => this.phoneModal.classList.remove('hidden'));
    }
    if (closePhoneModalBtn && this.phoneModal) {
      closePhoneModalBtn.addEventListener('click', () => this.phoneModal.classList.add('hidden'));
    }

    // Cleanup on window unload
    window.addEventListener('beforeunload', () => {
      this.stopCameraStream();
    });
  }

  // ==========================================================================
  // CAMERA ENGINE
  // ==========================================================================

  async initCamera() {
    this.updateStatus('Initializing camera...', 'loading');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showCameraAlert(
        'Camera API Not Supported',
        'Your browser does not support webcam access. You can still test the complete photobooth experience using our sample photos.'
      );
      this.updateStatus('Camera unavailable', 'error');
      return;
    }

    try {
      // Stop any existing tracks
      this.stopCameraStream();

      const constraints = {
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
        await this.videoEl.play();
      }

      this.updateStatus('Camera Ready', 'ready');
      if (this.cameraAlert) this.cameraAlert.classList.add('hidden');
      if (this.startSessionBtn) this.startSessionBtn.disabled = false;

      // Check available devices for camera flip button
      this.checkAvailableCameras();

    } catch (err) {
      console.warn('Camera access denied or error:', err);
      let errorTitle = 'Camera Access Required';
      let errorDesc = 'Please allow camera access in your browser to take live photobooth pictures. Alternatively, click "Use Sample Photos" below to test the entire experience instantly!';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorTitle = 'Camera Permission Blocked';
        errorDesc = 'Camera permission was dismissed or blocked. You can unblock it in browser settings or use our sample photos to continue.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorTitle = 'No Camera Detected';
        errorDesc = 'No webcam was detected on this device. You can test with our built-in photobooth sample photos.';
      }

      this.showCameraAlert(errorTitle, errorDesc);
      this.updateStatus('Camera Disabled', 'error');
    }
  }

  async checkAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoDevices.length > 1 && this.cameraSwitchBtn) {
        this.cameraSwitchBtn.classList.remove('hidden');
      }
    } catch (e) {
      // enumerateDevices might fail if permissions restricted
    }
  }

  async switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.videoEl) {
      if (this.facingMode === 'user') {
        this.videoEl.classList.add('mirror-video');
      } else {
        this.videoEl.classList.remove('mirror-video');
      }
    }
    await this.initCamera();
  }

  stopCameraStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }

  updateStatus(text, state = 'info') {
    if (!this.viewfinderStatus) return;
    this.viewfinderStatus.innerText = text;

    const dot = document.getElementById('camera-status-dot');
    if (dot) {
      dot.className = 'w-2 h-2 rounded-full inline-block mr-1.5 ';
      if (state === 'ready') dot.className += 'bg-emerald-500 animate-pulse';
      else if (state === 'loading') dot.className += 'bg-amber-500 animate-ping';
      else if (state === 'error') dot.className += 'bg-rose-500';
      else dot.className += 'bg-stone-400';
    }
  }

  showCameraAlert(title, message) {
    if (!this.cameraAlert) return;
    const titleEl = document.getElementById('alert-title');
    const descEl = document.getElementById('alert-desc');
    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = message;
    this.cameraAlert.classList.remove('hidden');
  }

  // ==========================================================================
  // FALLBACK SAMPLE PHOTOS MODE
  // ==========================================================================

  useSamplePhotos() {
    this.useSampleMode = true;
    if (this.cameraAlert) this.cameraAlert.classList.add('hidden');
    this.updateStatus('Sample Mode Active', 'ready');

    // Simulate 4 photos immediately loaded
    this.capturedPhotos = [...SAMPLE_PHOTOS];

    // Update mini strip thumbnails
    for (let i = 0; i < 4; i++) {
      this.updateSlotThumbnail(i, SAMPLE_PHOTOS[i]);
    }

    // Transition straight to review / result!
    this.showResultView();
  }

  // ==========================================================================
  // 4-CUT CAPTURE SEQUENCE
  // ==========================================================================

  async startCaptureSequence() {
    // If camera not ready and stream is null, prompt or fallback
    if (!this.stream && !this.useSampleMode) {
      await this.initCamera();
      if (!this.stream) {
        // Fallback to sample poses so session never fails to impress
        this.useSamplePhotos();
        return;
      }
    }

    this.isCapturing = true;
    this.capturedPhotos = [];
    this.currentShotIndex = 0;

    // Reset thumbnails in mini strip
    for (let i = 0; i < 4; i++) {
      this.clearSlotThumbnail(i);
    }

    // UI state adjustments
    if (this.startSessionBtn) this.startSessionBtn.classList.add('hidden');
    if (this.cancelSessionBtn) this.cancelSessionBtn.classList.remove('hidden');
    if (this.setupPanel) this.setupPanel.classList.add('opacity-50', 'pointer-events-none');

    // Run sequence through 4 shots
    for (let i = 0; i < 4; i++) {
      if (!this.isCapturing) return; // Check if cancelled
      this.currentShotIndex = i;

      // Update pose guide
      if (this.posePrompt) {
        this.posePrompt.innerText = this.poseTips[i];
        this.posePrompt.classList.remove('hidden');
      }

      this.updateStatus(`Capturing Frame 0${i + 1} / 04`, 'loading');

      // Countdown 3, 2, 1
      await this.runCountdown(3);

      if (!this.isCapturing) return;

      // Trigger capture flash & sound
      await this.triggerCapture(i);

      // Brief breather between shots (1.8s)
      if (i < 3 && this.isCapturing) {
        if (this.posePrompt) {
          this.posePrompt.innerText = `Get ready for frame 0${i + 2}...`;
        }
        await new Promise(r => setTimeout(r, 1800));
      }
    }

    // Sequence completed!
    this.isCapturing = false;
    if (this.posePrompt) this.posePrompt.classList.add('hidden');
    if (this.cancelSessionBtn) this.cancelSessionBtn.classList.add('hidden');

    // Short processing delay then show results
    this.updateStatus('Composing your 4-cut strip...', 'loading');
    setTimeout(() => {
      this.showResultView();
    }, 600);
  }

  cancelSession() {
    this.isCapturing = false;
    if (this.countdownDisplay) this.countdownDisplay.classList.add('hidden');
    if (this.posePrompt) this.posePrompt.classList.add('hidden');
    if (this.startSessionBtn) this.startSessionBtn.classList.remove('hidden');
    if (this.cancelSessionBtn) this.cancelSessionBtn.classList.add('hidden');
    if (this.setupPanel) this.setupPanel.classList.remove('opacity-50', 'pointer-events-none');
    this.updateStatus('Session cancelled', 'info');
  }

  runCountdown(seconds = 3) {
    return new Promise(resolve => {
      let count = seconds;
      if (!this.countdownDisplay || !this.countdownNumber) {
        setTimeout(resolve, seconds * 1000);
        return;
      }

      this.countdownDisplay.classList.remove('hidden');

      const tick = () => {
        if (!this.isCapturing) {
          this.countdownDisplay.classList.add('hidden');
          resolve();
          return;
        }

        if (count > 0) {
          this.countdownNumber.innerText = count;
          // Re-trigger CSS animation
          this.countdownNumber.classList.remove('animate-countdown');
          void this.countdownNumber.offsetWidth; // reflow
          this.countdownNumber.classList.add('animate-countdown');

          playBeep(count === 1 ? 880 : 587, 0.12);
          count--;
          setTimeout(tick, 1000);
        } else {
          this.countdownDisplay.classList.add('hidden');
          resolve();
        }
      };

      tick();
    });
  }

  async triggerCapture(shotIndex) {
    // Play shutter snap
    playShutterSound();

    // Trigger flash animation
    if (this.flashOverlay) {
      this.flashOverlay.classList.remove('flash-active');
      void this.flashOverlay.offsetWidth; // trigger reflow
      this.flashOverlay.classList.add('flash-active');
    }

    // Capture frame from video or fallback sample
    let photoData;
    if (this.stream && this.videoEl && this.videoEl.videoWidth > 0) {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = this.videoEl.videoWidth;
      snapCanvas.height = this.videoEl.videoHeight;
      const snapCtx = snapCanvas.getContext('2d');

      // Mirror if user front camera
      if (this.facingMode === 'user') {
        snapCtx.translate(snapCanvas.width, 0);
        snapCtx.scale(-1, 1);
      }
      snapCtx.drawImage(this.videoEl, 0, 0);
      photoData = snapCanvas.toDataURL('image/jpeg', 0.95);
    } else {
      photoData = SAMPLE_PHOTOS[shotIndex % SAMPLE_PHOTOS.length];
    }

    this.capturedPhotos.push(photoData);

    // Update thumbnail in live preview strip
    this.updateSlotThumbnail(shotIndex, photoData);
  }

  updateSlotThumbnail(index, src) {
    const slot = document.getElementById(`slot-${index}`);
    if (slot) {
      slot.innerHTML = `
        <img src="${src}" alt="Frame ${index + 1}" class="w-full h-full object-cover animate-photo-land" />
        <span class="absolute top-1.5 left-1.5 bg-[#781B28]/80 text-[#F8F3E9] text-[10px] px-1.5 py-0.5 rounded-sm font-sans font-medium">0${index + 1}</span>
      `;
    }
  }

  clearSlotThumbnail(index) {
    const slot = document.getElementById(`slot-${index}`);
    if (slot) {
      slot.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-stone-400">
          <span class="font-serif text-lg text-stone-400">0${index + 1}</span>
          <span class="text-[10px] uppercase tracking-wider font-sans mt-0.5">Empty</span>
        </div>
      `;
    }
  }

  // ==========================================================================
  // REVIEW & STRIP COMPOSITION
  // ==========================================================================

  async showResultView() {
    if (this.mainStudioView) this.mainStudioView.classList.add('hidden');
    if (this.resultPanel) this.resultPanel.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render Canvas
    await this.composeFinalStrip();
  }

  async composeFinalStrip() {
    if (!this.finalStripCanvas) return;
    this.updateStatus('Rendering photo strip...', 'loading');

    await renderStripOnCanvas(this.finalStripCanvas, this.capturedPhotos, this.selectedFrame);

    // Sync to print canvas if present
    if (this.printCanvas) {
      await renderStripOnCanvas(this.printCanvas, this.capturedPhotos, this.selectedFrame);
    }

    this.updateStatus('Strip Ready', 'ready');
  }

  highlightActiveFrame(frameId) {
    this.frameSelectors.forEach(btn => {
      const bId = btn.getAttribute('data-frame-id');
      const check = btn.querySelector('.frame-check');
      if (bId === frameId) {
        btn.classList.add('ring-2', 'ring-[#781B28]', 'border-[#781B28]', 'bg-[#FFFDF8]');
        btn.classList.remove('border-stone-200');
        if (check) check.classList.remove('hidden');
      } else {
        btn.classList.remove('ring-2', 'ring-[#781B28]', 'border-[#781B28]', 'bg-[#FFFDF8]');
        btn.classList.add('border-stone-200');
        if (check) check.classList.add('hidden');
      }
    });

    const activeLabel = document.getElementById('active-frame-label');
    if (activeLabel && FRAMES_CONFIG[frameId]) {
      activeLabel.innerText = FRAMES_CONFIG[frameId].name;
    }
  }

  retakeSession() {
    this.capturedPhotos = [];
    this.isCapturing = false;

    if (this.resultPanel) this.resultPanel.classList.add('hidden');
    if (this.mainStudioView) this.mainStudioView.classList.remove('hidden');
    if (this.setupPanel) this.setupPanel.classList.remove('opacity-50', 'pointer-events-none');
    if (this.startSessionBtn) this.startSessionBtn.classList.remove('hidden');
    if (this.cancelSessionBtn) this.cancelSessionBtn.classList.add('hidden');

    for (let i = 0; i < 4; i++) {
      this.clearSlotThumbnail(i);
    }

    if (!this.stream && !this.useSampleMode) {
      this.initCamera();
    } else {
      this.updateStatus('Camera Ready', 'ready');
    }
  }

  // ==========================================================================
  // SAVE & PRINT ENGINE
  // ==========================================================================

  downloadStrip() {
    if (!this.finalStripCanvas) return;

    try {
      const date = new Date();
      const filename = `framo-photobooth-${this.selectedFrame}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.png`;

      // High-quality PNG download via data URL or Blob
      if (this.finalStripCanvas.toBlob) {
        this.finalStripCanvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.finalStripCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('Download error:', e);
      alert('Unable to generate download image. Please try right clicking on the strip to save.');
    }
  }

  printStrip() {
    if (!this.finalStripCanvas) return;

    // Prepare print area image
    const printImg = document.getElementById('print-strip-img');
    if (printImg) {
      printImg.src = this.finalStripCanvas.toDataURL('image/png');
    }

    // Trigger window.print()
    setTimeout(() => {
      window.print();
    }, 150);
  }
}

// ============================================================================
// 6. INITIALIZATION ON DOM READY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if we are on studio page
  if (document.getElementById('viewfinder-box')) {
    window.framoStudioInstance = new FramoStudio();
    window.framoStudioInstance.init();
  }

  // Global mobile navigation toggle (for index.html and studio.html)
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileMenuToggle && mobileNav) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('hidden');
    });
  }

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          if (mobileNav) mobileNav.classList.add('hidden');
        }
      }
    });
  });

  // Setup landing page frame cards if on index.html
  const landingFrameCards = document.querySelectorAll('.landing-frame-card');
  if (landingFrameCards.length > 0) {
    const currentStored = getStoredFrame();

    landingFrameCards.forEach(card => {
      const frameId = card.getAttribute('data-frame-id');
      if (frameId === currentStored) {
        card.classList.add('ring-2', 'ring-[#781B28]', 'border-[#781B28]');
        const badge = card.querySelector('.selected-badge');
        if (badge) badge.classList.remove('hidden');
      }

      card.addEventListener('click', () => {
        landingFrameCards.forEach(c => {
          c.classList.remove('ring-2', 'ring-[#781B28]', 'border-[#781B28]');
          const b = c.querySelector('.selected-badge');
          if (b) b.classList.add('hidden');
        });

        card.classList.add('ring-2', 'ring-[#781B28]', 'border-[#781B28]');
        const b = card.querySelector('.selected-badge');
        if (b) b.classList.remove('hidden');

        setStoredFrame(frameId);

        // Update notification toast or button label
        const startStudioBtn = document.getElementById('selected-frame-cta');
        if (startStudioBtn && FRAMES_CONFIG[frameId]) {
          startStudioBtn.innerText = `Enter Studio with ${FRAMES_CONFIG[frameId].name} →`;
          startStudioBtn.href = `studio.html?frame=${frameId}`;
        }
      });
    });
  }
});
