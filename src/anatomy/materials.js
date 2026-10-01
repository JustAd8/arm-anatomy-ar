import * as THREE from 'three';

/**
 * Creates procedural textures for muscle striations, bone grain, and blood flow.
 */
function createProceduralTextures() {
  // Muscle fiber striations
  const muscleCanvas = document.createElement('canvas');
  muscleCanvas.width = 512;
  muscleCanvas.height = 512;
  const mCtx = muscleCanvas.getContext('2d');
  
  // Base dark crimson
  mCtx.fillStyle = '#6b0c1e';
  mCtx.fillRect(0, 0, 512, 512);
  
  // Longitudinal muscle fibers
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 512;
    const width = 1 + Math.random() * 3;
    const alpha = 0.15 + Math.random() * 0.35;
    const isBright = Math.random() > 0.6;
    mCtx.fillStyle = isBright ? `rgba(220, 38, 38, ${alpha})` : `rgba(136, 19, 55, ${alpha})`;
    mCtx.fillRect(x, 0, width, 512);
  }
  
  // Subtle cross-striations (sarcomere bands)
  mCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let y = 0; y < 512; y += 4) {
    mCtx.fillRect(0, y, 512, 1.5);
  }
  
  const muscleTexture = new THREE.CanvasTexture(muscleCanvas);
  muscleTexture.wrapS = THREE.RepeatWrapping;
  muscleTexture.wrapT = THREE.RepeatWrapping;
  muscleTexture.repeat.set(2, 4);

  // Bone grain texture
  const boneCanvas = document.createElement('canvas');
  boneCanvas.width = 256;
  boneCanvas.height = 256;
  const bCtx = boneCanvas.getContext('2d');
  bCtx.fillStyle = '#f5f0e6';
  bCtx.fillRect(0, 0, 256, 256);
  
  // Micro-porosity osteon specks
  for (let i = 0; i < 600; i++) {
    const bx = Math.random() * 256;
    const by = Math.random() * 256;
    const r = Math.random() * 1.5;
    bCtx.fillStyle = 'rgba(180, 160, 140, 0.12)';
    bCtx.beginPath();
    bCtx.arc(bx, by, r, 0, Math.PI * 2);
    bCtx.fill();
  }
  const boneTexture = new THREE.CanvasTexture(boneCanvas);
  boneTexture.wrapS = THREE.RepeatWrapping;
  boneTexture.wrapT = THREE.RepeatWrapping;

  // Pulsing blood cell / flow texture
  const bloodCanvas = document.createElement('canvas');
  bloodCanvas.width = 256;
  bloodCanvas.height = 64;
  const blCtx = bloodCanvas.getContext('2d');
  const gradient = blCtx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
  blCtx.fillStyle = gradient;
  blCtx.fillRect(0, 0, 256, 64);
  const bloodTexture = new THREE.CanvasTexture(bloodCanvas);
  bloodTexture.wrapS = THREE.RepeatWrapping;
  bloodTexture.wrapT = THREE.RepeatWrapping;

  return { muscleTexture, boneTexture, bloodTexture };
}

export class AnatomyMaterialManager {
  constructor() {
    this.textures = createProceduralTextures();
    this.currentMode = 'realistic'; // 'realistic' | 'hologram' | 'xray' | 'biolum'
    this.time = 0;
    this.pulsePhase = 0;
    this.bpm = 72;
    
    this.layerOpacities = {
      bones: 0.95,
      muscles: 0.88,
      veins: 0.95,
      arteries: 0.95,
      nerves: 0.9,
      envelope: 0.15
    };

    this.materials = this.buildMaterials();
  }

  buildMaterials() {
    const { muscleTexture, boneTexture, bloodTexture } = this.textures;

    return {
      // BONE MATERIALS
      bone: new THREE.MeshStandardMaterial({
        color: 0xf1ebe1,
        roughness: 0.35,
        metalness: 0.05,
        map: boneTexture,
        transparent: true,
        opacity: this.layerOpacities.bones,
        depthWrite: true,
      }),
      boneCartilage: new THREE.MeshStandardMaterial({
        color: 0xd9e8f5,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
      }),

      // MUSCLE MATERIALS
      muscle: new THREE.MeshStandardMaterial({
        color: 0x9b1c2b,
        roughness: 0.55,
        metalness: 0.15,
        map: muscleTexture,
        transparent: true,
        opacity: this.layerOpacities.muscles,
        bumpMap: muscleTexture,
        bumpScale: 0.05,
      }),
      tendon: new THREE.MeshStandardMaterial({
        color: 0xf3f4f6,
        roughness: 0.25,
        metalness: 0.2,
        transparent: true,
        opacity: 0.92,
      }),

      // VASCULAR MATERIALS
      vein: new THREE.MeshStandardMaterial({
        color: 0x0091ff,
        emissive: 0x0044aa,
        emissiveIntensity: 0.6,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: this.layerOpacities.veins,
      }),
      artery: new THREE.MeshStandardMaterial({
        color: 0xff1744,
        emissive: 0xdd0022,
        emissiveIntensity: 0.75,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: this.layerOpacities.arteries,
      }),

      // NERVE MATERIAL
      nerve: new THREE.MeshStandardMaterial({
        color: 0xffd600,
        emissive: 0xffaa00,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: this.layerOpacities.nerves,
      }),

      // AR HOLOGRAPHIC ENVELOPE / ARM CONTOUR
      envelope: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        wireframe: false,
        transparent: true,
        opacity: this.layerOpacities.envelope,
        roughness: 0.1,
        metalness: 0.8,
        side: THREE.DoubleSide
      }),

      // SELECTION / HIGHLIGHT MATERIAL
      highlight: new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      }),

      // JOINT GLOW NODES
      jointGlow: new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
      })
    };
  }

  setVisualMode(mode) {
    this.currentMode = mode;
    const m = this.materials;

    if (mode === 'realistic') {
      m.bone.color.setHex(0xf1ebe1);
      m.bone.emissive.setHex(0x000000);
      m.bone.wireframe = false;

      m.muscle.color.setHex(0x9b1c2b);
      m.muscle.emissive.setHex(0x1a0307);
      m.muscle.wireframe = false;

      m.vein.color.setHex(0x0091ff);
      m.vein.emissive.setHex(0x0044aa);
      m.vein.wireframe = false;

      m.artery.color.setHex(0xff1744);
      m.artery.emissive.setHex(0xdd0022);
      m.artery.wireframe = false;

      m.nerve.color.setHex(0xffd600);
      m.nerve.emissive.setHex(0xffaa00);

      m.envelope.color.setHex(0x38bdf8);
      m.envelope.opacity = this.layerOpacities.envelope;
      m.envelope.wireframe = false;
    } 
    else if (mode === 'hologram') {
      // Neon Cyber AR HUD style
      m.bone.color.setHex(0x00ffff);
      m.bone.emissive.setHex(0x0088aa);
      m.bone.emissiveIntensity = 0.8;
      m.bone.wireframe = true;

      m.muscle.color.setHex(0xff0055);
      m.muscle.emissive.setHex(0xaa0033);
      m.muscle.emissiveIntensity = 0.9;
      m.muscle.wireframe = true;

      m.vein.color.setHex(0x00e5ff);
      m.vein.emissive.setHex(0x00ffff);
      m.vein.emissiveIntensity = 1.2;
      m.vein.wireframe = false;

      m.artery.color.setHex(0xff003c);
      m.artery.emissive.setHex(0xff3366);
      m.artery.emissiveIntensity = 1.3;
      m.artery.wireframe = false;

      m.nerve.color.setHex(0xffd700);
      m.nerve.emissive.setHex(0xffff00);

      m.envelope.color.setHex(0x00f0ff);
      m.envelope.opacity = 0.25;
      m.envelope.wireframe = true;
    }
    else if (mode === 'xray') {
      // Clinical Fluoroscopy Radiograph style
      m.bone.color.setHex(0xffffff);
      m.bone.emissive.setHex(0xa5c9ff);
      m.bone.emissiveIntensity = 0.9;
      m.bone.wireframe = false;

      m.muscle.color.setHex(0x1e293b);
      m.muscle.emissive.setHex(0x0f172a);
      m.muscle.emissiveIntensity = 0.3;
      m.muscle.opacity = 0.35;
      m.muscle.wireframe = false;

      m.vein.color.setHex(0x38bdf8);
      m.vein.emissive.setHex(0x0ea5e9);
      m.vein.emissiveIntensity = 0.7;

      m.artery.color.setHex(0xf43f5e);
      m.artery.emissive.setHex(0xe11d48);
      m.artery.emissiveIntensity = 0.8;

      m.nerve.color.setHex(0xfef08a);
      m.nerve.emissive.setHex(0xeab308);

      m.envelope.color.setHex(0x60a5fa);
      m.envelope.opacity = 0.12;
      m.envelope.wireframe = false;
    }
    else if (mode === 'biolum') {
      // Bioluminescent organism
      m.bone.color.setHex(0x0f766e);
      m.bone.emissive.setHex(0x14b8a6);
      m.bone.emissiveIntensity = 0.75;
      m.bone.wireframe = false;

      m.muscle.color.setHex(0x4c1d95);
      m.muscle.emissive.setHex(0x7c3aed);
      m.muscle.emissiveIntensity = 0.8;
      m.muscle.wireframe = false;

      m.vein.color.setHex(0x06b6d4);
      m.vein.emissive.setHex(0x22d3ee);
      m.vein.emissiveIntensity = 1.2;

      m.artery.color.setHex(0xf43f5e);
      m.artery.emissive.setHex(0xfb7185);
      m.artery.emissiveIntensity = 1.4;

      m.nerve.color.setHex(0xa3e635);
      m.nerve.emissive.setHex(0x84cc16);

      m.envelope.color.setHex(0x8b5cf6);
      m.envelope.opacity = 0.2;
      m.envelope.wireframe = false;
    }

    this.updateOpacities();
  }

  setLayerOpacity(layer, opacity) {
    if (this.layerOpacities[layer] !== undefined) {
      this.layerOpacities[layer] = opacity;
      this.updateOpacities();
    }
  }

  updateOpacities() {
    const { bones, muscles, veins, arteries, nerves, envelope } = this.layerOpacities;
    const m = this.materials;
    
    m.bone.opacity = bones;
    m.bone.visible = bones > 0.01;
    m.boneCartilage.opacity = bones * 0.85;
    m.boneCartilage.visible = bones > 0.01;

    m.muscle.opacity = muscles;
    m.muscle.visible = muscles > 0.01;
    m.tendon.opacity = muscles * 0.95;
    m.tendon.visible = muscles > 0.01;

    m.vein.opacity = veins;
    m.vein.visible = veins > 0.01;

    m.artery.opacity = arteries;
    m.artery.visible = arteries > 0.01;

    m.nerve.opacity = nerves;
    m.nerve.visible = nerves > 0.01;

    m.envelope.opacity = envelope;
    m.envelope.visible = envelope > 0.005;
  }

  update(delta) {
    this.time += delta;
    
    // Heartbeat pulse cycle (systole/diastole)
    const beatsPerSec = this.bpm / 60;
    this.pulsePhase = (this.pulsePhase + delta * beatsPerSec) % 1;
    
    // Systolic spike curve
    const pulseStrength = Math.pow(Math.sin(this.pulsePhase * Math.PI), 8);
    const arteryScale = 1.0 + 0.15 * pulseStrength;
    
    // Arterial pulsation intensity
    if (this.materials.artery) {
      this.materials.artery.emissiveIntensity = 0.6 + 0.7 * pulseStrength;
    }

    // Venous subtle fluid motion
    if (this.materials.vein) {
      const veinWave = Math.sin(this.time * 2.5) * 0.1 + 0.9;
      this.materials.vein.emissiveIntensity = 0.5 * veinWave;
    }

    // Nerve action potential electrical flicker
    if (this.materials.nerve) {
      const nerveSpike = Math.random() > 0.85 ? 1.4 : 0.75;
      this.materials.nerve.emissiveIntensity = nerveSpike;
    }

    return { arteryScale, pulseStrength };
  }
}
