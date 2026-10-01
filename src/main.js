import * as THREE from 'three';
import './style.css';
import { ANATOMY_DATABASE } from './anatomy/anatomyData.js';
import { AnatomyMaterialManager } from './anatomy/materials.js';
import { ArmAnatomyModel } from './anatomy/modelGenerator.js';
import { PoseTracker } from './tracker/poseTracker.js';
import { AudioSynthesizer } from './audio/audioSynth.js';

class BioScanApp {
  constructor() {
    this.video = document.getElementById('camera-video');
    this.canvas = document.getElementById('three-canvas');
    
    // Core Managers
    this.materialManager = new AnatomyMaterialManager();
    this.audioSynth = new AudioSynthesizer();
    this.clock = new THREE.Clock();

    // Scene setup
    this.initThree();

    // Anatomy Models (Left & Right arms)
    this.rightArm = new ArmAnatomyModel('right', this.materialManager);
    this.leftArm = new ArmAnatomyModel('left', this.materialManager);
    this.scene.add(this.rightArm.group);
    this.scene.add(this.leftArm.group);

    // Target arm visibility configuration
    this.targetArmMode = 'both'; // 'both' | 'right' | 'left'

    // Raycaster for interactive 3D anatomy inspection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredMesh = null;

    // Pose Tracker
    this.tracker = new PoseTracker(this.video, this.camera, {
      smoothing: 0.65,
      targetArm: 'both'
    });

    // Fit & Thickness options
    this.options = {
      armThickness: 1.0,
      smoothing: 0.65
    };

    // UI Bindings
    this.initUI();
    this.initAtlas();
    this.initEventListeners();

    // Start Pose Tracking & Render loop
    this.start();
  }

  // -------------------------------------------------------------
  // THREE.JS SCENE INITIALIZATION
  // -------------------------------------------------------------
  initThree() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.05, 100);
    this.camera.position.set(0, 0, 0); // Origin at camera view center
    this.scene.add(this.camera);

    // High quality WebGL Renderer with transparency
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Required for snapshot composite capture
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Lighting Setup: Multi-directional studio lighting with cybernetic rim glows
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
    keyLight.position.set(2, 4, 3);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-3, -2, 2);
    this.scene.add(fillLight);

    // Rim lights for deep muscular contour relief
    const rimCyan = new THREE.PointLight(0x00f0ff, 2.2, 10);
    rimCyan.position.set(2, 0, -1);
    this.scene.add(rimCyan);

    const rimRed = new THREE.PointLight(0xff2a5f, 1.8, 10);
    rimRed.position.set(-2, 0, -1);
    this.scene.add(rimRed);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // -------------------------------------------------------------
  // POSE TRACKER & APPLICATION LIFECYCLE
  // -------------------------------------------------------------
  async start() {
    const statusText = document.getElementById('source-status-text');
    const telemPill = document.getElementById('telem-source');

    // Initialize MediaPipe Pose
    await this.tracker.init();

    // Callback on landmark calculations
    this.tracker.onResultsCallback = (landmarks, stats) => this.onPoseResults(landmarks, stats);

    // Attempt to start camera feed; if denied or unavailable, start demo simulation
    const cameraStarted = await this.tracker.startCamera();
    if (cameraStarted) {
      statusText.textContent = 'CAMERA ACTIVE';
      telemPill.className = 'telem-pill active';
      document.getElementById('btn-camera-text').textContent = 'Camera Feed';
    } else {
      statusText.textContent = 'DEMO SIMULATION';
      telemPill.className = 'telem-pill demo';
      document.getElementById('btn-camera-text').textContent = 'Simulation Mode';
    }

    // Begin Three.js Animation Loop
    this.animate();
  }

  onPoseResults(landmarks, stats) {
    // Update top telemetry stats
    document.getElementById('fps-counter').textContent = `${stats.fps} FPS`;
    document.getElementById('latency-counter').textContent = `${stats.latencyMs}ms`;
    document.getElementById('active-arm-text').textContent = stats.activeArm.toUpperCase();

    // Update Right Arm 3D Model
    if (landmarks.right.visible && (this.targetArmMode === 'both' || this.targetArmMode === 'right')) {
      this.rightArm.setVisible(true);
      this.rightArm.updatePose(
        landmarks.right.shoulder,
        landmarks.right.elbow,
        landmarks.right.wrist,
        landmarks.right.hand,
        this.options
      );
    } else {
      this.rightArm.setVisible(false);
    }

    // Update Left Arm 3D Model
    if (landmarks.left.visible && (this.targetArmMode === 'both' || this.targetArmMode === 'left')) {
      this.leftArm.setVisible(true);
      this.leftArm.updatePose(
        landmarks.left.shoulder,
        landmarks.left.elbow,
        landmarks.left.wrist,
        landmarks.left.hand,
        this.options
      );
    } else {
      this.leftArm.setVisible(false);
    }

    // Update HUD Goniometer and Contraction meters with active arm
    const primaryMetrics = landmarks.right.visible ? this.rightArm.metrics : this.leftArm.metrics;
    if (primaryMetrics) {
      const angle = primaryMetrics.elbowAngleDeg;
      const contract = primaryMetrics.contractionPercent;

      const angleEl = document.getElementById('val-elbow-angle');
      const angleFill = document.getElementById('fill-elbow-angle');
      const contractEl = document.getElementById('val-biceps-contract');
      const contractFill = document.getElementById('fill-biceps-contract');

      if (angleEl) angleEl.textContent = angle;
      if (angleFill) angleFill.style.width = `${Math.min(100, Math.round((angle / 180) * 100))}%`;

      if (contractEl) contractEl.textContent = contract;
      if (contractFill) contractFill.style.width = `${contract}%`;
    }
  }

  // -------------------------------------------------------------
  // ANIMATION & RENDERING LOOP
  // -------------------------------------------------------------
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // Update dynamic materials (arterial heartbeat pulse & blood flow)
    const { arteryScale, pulseStrength } = this.materialManager.update(delta);

    // Audio heartbeat tick on systolic contraction peak
    if (pulseStrength > 0.88 && !this.pulseFired) {
      this.audioSynth.playHeartbeat();
      this.pulseFired = true;
    } else if (pulseStrength < 0.2) {
      this.pulseFired = false;
    }

    // Interactive 3D Raycasting for Anatomy Hover / Inspection
    this.checkRaycast();

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  // -------------------------------------------------------------
  // 3D RAYCASTING & INTERACTIVE CALLOUT
  // -------------------------------------------------------------
  checkRaycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const candidates = [
      ...this.rightArm.interactiveMeshes,
      ...this.leftArm.interactiveMeshes
    ].filter(mesh => mesh.visible && mesh.parent && mesh.parent.visible && mesh.parent.parent && mesh.parent.parent.visible);

    const intersects = this.raycaster.intersectObjects(candidates, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (this.hoveredMesh !== hit) {
        this.hoveredMesh = hit;
        this.showInspector(hit.userData);
      }
    } else {
      if (this.hoveredMesh && !this.lockedInspector) {
        this.hoveredMesh = null;
        this.hideInspector();
      }
    }
  }

  showInspector(userData) {
    if (!userData || !userData.info) return;
    const info = userData.info;
    const card = document.getElementById('inspector-card');

    document.getElementById('inspect-title').textContent = info.name;
    document.getElementById('inspect-latin').textContent = info.latinName;
    document.getElementById('inspect-desc').textContent = info.description;

    const tag = document.getElementById('inspect-tag');
    tag.textContent = info.system;
    tag.className = `card-system-tag ${info.system.split(' ')[0]}`;

    const clinicalText = info.details.clinicalNote 
      ? `Clinical: ${info.details.clinicalNote}`
      : `Action: ${info.details.action || info.details.articulations || 'Anatomical landmark'}`;
    document.getElementById('inspect-clinical').textContent = clinicalText;

    card.classList.remove('hidden');
  }

  hideInspector() {
    document.getElementById('inspector-card').classList.add('hidden');
  }

  // -------------------------------------------------------------
  // UI INITIALIZATION & EVENT LISTENERS
  // -------------------------------------------------------------
  initUI() {
    // Layer Toggles & Opacity Sliders
    const layers = ['bones', 'muscles', 'veins', 'arteries', 'nerves', 'envelope'];
    layers.forEach(layer => {
      const toggle = document.getElementById(`toggle-${layer}`);
      const slider = document.getElementById(`slider-${layer}`);
      const label = document.getElementById(`label-${layer}`);

      if (toggle && slider) {
        toggle.addEventListener('change', (e) => {
          const val = e.target.checked ? parseFloat(slider.value) : 0;
          this.materialManager.setLayerOpacity(layer, val);
          this.audioSynth.playBeep(520, 0.04);
        });

        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (toggle.checked) {
            this.materialManager.setLayerOpacity(layer, val);
          }
          if (label) label.textContent = `${Math.round(val * 100)}%`;
        });
      }
    });

    // Visual Shaders / Render Modes
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const mode = card.dataset.mode;
        this.materialManager.setVisualMode(mode);
        this.audioSynth.playBeep(740, 0.05);
      });
    });

    // Pulse Rate (BPM) Slider
    const bpmSlider = document.getElementById('slider-bpm');
    const bpmLabel = document.getElementById('label-bpm');
    const bpmCounter = document.getElementById('bpm-counter');
    if (bpmSlider) {
      bpmSlider.addEventListener('input', (e) => {
        const bpm = parseInt(e.target.value, 10);
        this.materialManager.bpm = bpm;
        if (bpmLabel) bpmLabel.textContent = bpm;
        if (bpmCounter) bpmCounter.textContent = `${bpm} BPM`;
      });
    }

    // Arm Thickness / Scale Slider
    const thickSlider = document.getElementById('slider-thickness');
    const thickLabel = document.getElementById('label-thickness');
    if (thickSlider) {
      thickSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.options.armThickness = val;
        this.rightArm.setArmThickness(val);
        this.leftArm.setArmThickness(val);
        if (thickLabel) thickLabel.textContent = `${val.toFixed(2)}x`;
      });
    }

    // Landmark Smoothing Slider
    const smoothSlider = document.getElementById('slider-smoothing');
    const smoothLabel = document.getElementById('label-smoothing');
    if (smoothSlider) {
      smoothSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.options.smoothing = val;
        this.tracker.setSmoothing(val);
        if (smoothLabel) smoothLabel.textContent = `${Math.round(val * 100)}%`;
      });
    }

    // Target Arm Selector
    const armBothBtn = document.getElementById('btn-arm-both');
    const armRightBtn = document.getElementById('btn-arm-right');
    const armLeftBtn = document.getElementById('btn-arm-left');
    const armBtns = [armBothBtn, armRightBtn, armLeftBtn];

    const setArmMode = (mode, activeBtn) => {
      this.targetArmMode = mode;
      armBtns.forEach(b => b?.classList.remove('active'));
      activeBtn?.classList.add('active');
      this.audioSynth.playBeep(600, 0.04);
    };

    armBothBtn?.addEventListener('click', () => setArmMode('both', armBothBtn));
    armRightBtn?.addEventListener('click', () => setArmMode('right', armRightBtn));
    armLeftBtn?.addEventListener('click', () => setArmMode('left', armLeftBtn));

    // Side Dock Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.dock-panel');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        document.getElementById(targetId)?.classList.add('active');
        this.audioSynth.playBeep(680, 0.03);
      });
    });

    // Side Dock Collapse / Open
    const sideDock = document.getElementById('side-dock');
    const btnCloseDock = document.getElementById('btn-close-dock');
    const btnOpenDock = document.getElementById('btn-open-dock');

    btnCloseDock?.addEventListener('click', () => {
      sideDock.classList.add('collapsed');
      btnOpenDock.classList.remove('hidden');
      this.audioSynth.playBeep(480, 0.04);
    });

    btnOpenDock?.addEventListener('click', () => {
      sideDock.classList.remove('collapsed');
      btnOpenDock.classList.add('hidden');
      this.audioSynth.playBeep(640, 0.04);
    });
  }

  // -------------------------------------------------------------
  // ANATOMY ATLAS CATALOGUE (SEARCH & ISOLATE)
  // -------------------------------------------------------------
  initAtlas() {
    const listEl = document.getElementById('atlas-items-list');
    const searchInput = document.getElementById('atlas-search-input');
    if (!listEl) return;

    const renderList = (filter = '') => {
      listEl.innerHTML = '';
      const filterLower = filter.toLowerCase();

      Object.values(ANATOMY_DATABASE).forEach(item => {
        if (filter && !item.name.toLowerCase().includes(filterLower) && !item.system.toLowerCase().includes(filterLower)) {
          return;
        }

        const row = document.createElement('div');
        row.className = 'atlas-item';
        row.innerHTML = `
          <div>
            <div class="atlas-item-name">${item.name}</div>
            <div style="font-size: 10px; color: var(--text-muted); font-style: italic;">${item.latinName}</div>
          </div>
          <span class="card-system-tag ${item.system.split(' ')[0]}">${item.system}</span>
        `;

        row.addEventListener('click', () => {
          this.showInspector({ info: item });
          this.lockedInspector = true;
          this.audioSynth.playBeep(820, 0.06);

          // Auto-hide callout after 6 seconds if not hovered
          clearTimeout(this.lockTimeout);
          this.lockTimeout = setTimeout(() => {
            this.lockedInspector = false;
          }, 6000);
        });

        listEl.appendChild(row);
      });
    };

    renderList();
    searchInput?.addEventListener('input', (e) => renderList(e.target.value));
  }

  // -------------------------------------------------------------
  // GLOBAL ACTION EVENT LISTENERS
  // -------------------------------------------------------------
  initEventListeners() {
    // Camera / Simulation Mode Toggle
    const btnCameraToggle = document.getElementById('btn-camera-toggle');
    const btnCameraText = document.getElementById('btn-camera-text');
    const telemPill = document.getElementById('telem-source');
    const statusText = document.getElementById('source-status-text');

    btnCameraToggle?.addEventListener('click', async () => {
      if (this.tracker.isCameraActive) {
        this.tracker.stopCamera();
        this.tracker.startDemoMode();
        btnCameraText.textContent = 'Simulation Mode';
        btnCameraToggle.classList.remove('primary');
        telemPill.className = 'telem-pill demo';
        statusText.textContent = 'DEMO SIMULATION';
      } else {
        const success = await this.tracker.startCamera();
        if (success) {
          btnCameraText.textContent = 'Camera Feed';
          btnCameraToggle.classList.add('primary');
          telemPill.className = 'telem-pill active';
          statusText.textContent = 'CAMERA ACTIVE';
        }
      }
      this.audioSynth.playBeep(660, 0.05);
    });

    // Pause / Freeze Frame Toggle
    const btnPause = document.getElementById('btn-pause-toggle');
    btnPause?.addEventListener('click', () => {
      const isPaused = this.tracker.togglePause();
      btnPause.classList.toggle('active', isPaused);
      btnPause.querySelector('span').textContent = isPaused ? 'Resume' : 'Freeze';
      this.audioSynth.playBeep(560, 0.06);
    });

    // Mirror Toggle
    const btnMirror = document.getElementById('btn-mirror-toggle');
    btnMirror?.addEventListener('click', () => {
      const isMirrored = !this.tracker.isMirrored;
      this.tracker.setMirror(isMirrored);
      btnMirror.classList.toggle('active', isMirrored);
      this.audioSynth.playBeep(640, 0.04);
    });

    // Sound Toggle
    const btnAudio = document.getElementById('btn-audio-toggle');
    btnAudio?.addEventListener('click', () => {
      const enabled = this.audioSynth.toggle();
      btnAudio.classList.toggle('active', enabled);
    });

    // High-Resolution AR Photo Snapshot Capture
    const btnSnapshot = document.getElementById('btn-snapshot');
    btnSnapshot?.addEventListener('click', () => this.captureSnapshot());

    // Help Modal
    const btnInfo = document.getElementById('btn-info');
    const helpModal = document.getElementById('help-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnModalOk = document.getElementById('btn-modal-ok');

    btnInfo?.addEventListener('click', () => helpModal.classList.add('open'));
    btnCloseModal?.addEventListener('click', () => helpModal.classList.remove('open'));
    btnModalOk?.addEventListener('click', () => helpModal.classList.remove('open'));

    // Raycast Mouse Coordinate Tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    }, { passive: true });
  }

  // -------------------------------------------------------------
  // HIGH-RESOLUTION AR SNAPSHOT EXPORT
  // -------------------------------------------------------------
  captureSnapshot() {
    this.audioSynth.playBeep(980, 0.1, 'triangle');

    // Create offscreen composite canvas
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = this.canvas.width;
    snapCanvas.height = this.canvas.height;
    const ctx = snapCanvas.getContext('2d');

    // 1. Draw video feed frame
    if (this.tracker.isCameraActive && this.video.readyState >= 2) {
      ctx.save();
      if (this.tracker.isMirrored) {
        ctx.scale(-1, 1);
        ctx.drawImage(this.video, -snapCanvas.width, 0, snapCanvas.width, snapCanvas.height);
      } else {
        ctx.drawImage(this.video, 0, 0, snapCanvas.width, snapCanvas.height);
      }
      ctx.restore();
    } else {
      // Dark gradient background in demo mode
      const grad = ctx.createRadialGradient(
        snapCanvas.width / 2, snapCanvas.height / 2, 50,
        snapCanvas.width / 2, snapCanvas.height / 2, snapCanvas.width / 1.5
      );
      grad.addColorStop(0, '#0d1527');
      grad.addColorStop(1, '#050811');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, snapCanvas.width, snapCanvas.height);
    }

    // 2. Draw 3D Three.js WebGL layer
    ctx.drawImage(this.canvas, 0, 0);

    // 3. Draw Watermark & Telemetry banner
    ctx.fillStyle = 'rgba(6, 10, 20, 0.7)';
    ctx.fillRect(20, snapCanvas.height - 70, 360, 50);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, snapCanvas.height - 70, 360, 50);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillText('BIOSCAN AR — 3D ANATOMY OVERLAY', 35, snapCanvas.height - 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`ELBOW: ${this.rightArm.metrics.elbowAngleDeg}° | BICEPS: ${this.rightArm.metrics.contractionPercent}% | ${new Date().toLocaleTimeString()}`, 35, snapCanvas.height - 26);

    // 4. Download file
    const link = document.createElement('a');
    link.download = `bioscan-arm-anatomy-${Date.now()}.png`;
    link.href = snapCanvas.toDataURL('image/png');
    link.click();
  }
}

// Instantiate application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.bioScanApp = new BioScanApp();
});
