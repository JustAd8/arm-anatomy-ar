import * as THREE from 'three';

/**
 * PoseTracker manages the device webcam, MediaPipe Pose tracking,
 * coordinate mapping to Three.js camera frustum, and temporal smoothing.
 */
export class PoseTracker {
  constructor(videoElement, threeCamera, options = {}) {
    this.video = videoElement;
    this.camera = threeCamera;
    this.isTracking = false;
    this.isCameraActive = false;
    this.isDemoMode = false;
    this.isPaused = false;
    this.isMirrored = true;

    // Smoothing coefficient (0: instant/jittery, 1: ultra-smooth/laggy)
    this.smoothing = options.smoothing || 0.65;
    this.targetArm = options.targetArm || 'both'; // 'both' | 'left' | 'right' | 'auto'

    // Callback on landmark updates
    this.onResultsCallback = null;

    // Smoothed 3D landmarks for Left and Right arms
    this.smoothedArmLandmarks = {
      left: {
        shoulder: new THREE.Vector3(),
        elbow: new THREE.Vector3(),
        wrist: new THREE.Vector3(),
        hand: new THREE.Vector3(),
        visible: false,
        confidence: 0
      },
      right: {
        shoulder: new THREE.Vector3(),
        elbow: new THREE.Vector3(),
        wrist: new THREE.Vector3(),
        hand: new THREE.Vector3(),
        visible: false,
        confidence: 0
      }
    };

    // FPS & Latency performance monitor
    this.stats = {
      fps: 0,
      latencyMs: 0,
      frameCount: 0,
      lastTime: performance.now(),
      activeArm: 'None'
    };

    // MediaPipe instance
    this.pose = null;
    this.animationFrameId = null;

    // Synthetic demo motion state
    this.demoTime = 0;
  }

  /**
   * Initializes MediaPipe Pose and tries to start webcam.
   */
  async init() {
    try {
      if (typeof window.Pose !== 'undefined') {
        this.pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
      } else {
        // Fallback dynamic load if script tag was deferred
        await this.loadMediaPipeScript();
        this.pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
      }

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.pose.onResults((results) => this.handlePoseResults(results));
    } catch (err) {
      console.warn('MediaPipe Pose initialization note:', err);
    }
  }

  loadMediaPipeScript() {
    return new Promise((resolve, reject) => {
      if (window.Pose) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load MediaPipe Pose script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Starts device webcam.
   */
  async startCamera() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = stream;
      await this.video.play();
      this.isCameraActive = true;
      this.isDemoMode = false;
      this.isTracking = true;

      this.startProcessingLoop();
      return true;
    } catch (err) {
      console.warn('Camera access not granted or unavailable, starting Demo Simulation mode:', err);
      this.startDemoMode();
      return false;
    }
  }

  stopCamera() {
    if (this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
    this.isCameraActive = false;
  }

  startDemoMode() {
    this.isDemoMode = true;
    this.isTracking = true;
    this.startProcessingLoop();
  }

  startProcessingLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const process = async () => {
      const startTime = performance.now();

      if (!this.isPaused) {
        if (this.isDemoMode) {
          this.updateDemoMotion();
        } else if (this.isCameraActive && this.pose && this.video.readyState >= 2) {
          try {
            await this.pose.send({ image: this.video });
          } catch (e) {
            console.error('Pose processing error:', e);
          }
        }
      }

      // Compute FPS & latency
      this.stats.frameCount++;
      const now = performance.now();
      this.stats.latencyMs = Math.round(now - startTime);
      if (now - this.stats.lastTime >= 1000) {
        this.stats.fps = Math.round((this.stats.frameCount * 1000) / (now - this.stats.lastTime));
        this.stats.frameCount = 0;
        this.stats.lastTime = now;
      }

      if (this.isTracking) {
        this.animationFrameId = requestAnimationFrame(process);
      }
    };

    this.animationFrameId = requestAnimationFrame(process);
  }

  /**
   * Processes MediaPipe landmarks and maps them to Three.js 3D space.
   */
  handlePoseResults(results) {
    if (!results || !results.poseLandmarks) {
      this.smoothedArmLandmarks.left.visible = false;
      this.smoothedArmLandmarks.right.visible = false;
      if (this.onResultsCallback) {
        this.onResultsCallback(this.smoothedArmLandmarks, this.stats);
      }
      return;
    }

    const lm = results.poseLandmarks;
    const lerpAlpha = 1.0 - this.smoothing;

    // Helper: Map 2D normalized MediaPipe (0..1) to 3D Three.js camera coordinates
    const mapTo3D = (landmark, targetVec) => {
      // In camera space:
      // x: 0 is left, 1 is right (if mirrored, flip x)
      let normX = this.isMirrored ? (1.0 - landmark.x) : landmark.x;
      let normY = landmark.y; // 0 is top, 1 is bottom

      // Map to NDC [-1, 1]
      const ndcX = (normX - 0.5) * 2;
      const ndcY = -(normY - 0.5) * 2;
      
      // Depth estimation: MediaPipe z is relative; map base depth ~ -1.2m to -2.0m
      const depthZ = -1.5 + (landmark.z || 0) * 1.2;

      // Project onto Three.js frustum at depthZ
      const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
      const halfHeight = Math.tan(fovRad / 2) * Math.abs(depthZ);
      const halfWidth = halfHeight * this.camera.aspect;

      const rawX = ndcX * halfWidth;
      const rawY = ndcY * halfHeight;
      const rawZ = depthZ;

      if (targetVec.length() === 0) {
        targetVec.set(rawX, rawY, rawZ);
      } else {
        targetVec.x = THREE.MathUtils.lerp(targetVec.x, rawX, lerpAlpha);
        targetVec.y = THREE.MathUtils.lerp(targetVec.y, rawY, lerpAlpha);
        targetVec.z = THREE.MathUtils.lerp(targetVec.z, rawZ, lerpAlpha);
      }
    };

    // Right Arm (MediaPipe: 12 shoulder, 14 elbow, 16 wrist, 20 index)
    // Left Arm (MediaPipe: 11 shoulder, 13 elbow, 15 wrist, 19 index)
    const rightVisible = (lm[12]?.visibility > 0.4 && lm[14]?.visibility > 0.4 && lm[16]?.visibility > 0.35);
    const leftVisible = (lm[11]?.visibility > 0.4 && lm[13]?.visibility > 0.4 && lm[15]?.visibility > 0.35);

    if (rightVisible) {
      mapTo3D(lm[12], this.smoothedArmLandmarks.right.shoulder);
      mapTo3D(lm[14], this.smoothedArmLandmarks.right.elbow);
      mapTo3D(lm[16], this.smoothedArmLandmarks.right.wrist);
      if (lm[20]) mapTo3D(lm[20], this.smoothedArmLandmarks.right.hand);
      this.smoothedArmLandmarks.right.visible = true;
      this.smoothedArmLandmarks.right.confidence = (lm[12].visibility + lm[14].visibility + lm[16].visibility) / 3;
    } else {
      this.smoothedArmLandmarks.right.visible = false;
    }

    if (leftVisible) {
      mapTo3D(lm[11], this.smoothedArmLandmarks.left.shoulder);
      mapTo3D(lm[13], this.smoothedArmLandmarks.left.elbow);
      mapTo3D(lm[15], this.smoothedArmLandmarks.left.wrist);
      if (lm[19]) mapTo3D(lm[19], this.smoothedArmLandmarks.left.hand);
      this.smoothedArmLandmarks.left.visible = true;
      this.smoothedArmLandmarks.left.confidence = (lm[11].visibility + lm[13].visibility + lm[15].visibility) / 3;
    } else {
      this.smoothedArmLandmarks.left.visible = false;
    }

    // Determine active arm
    if (this.smoothedArmLandmarks.right.visible && this.smoothedArmLandmarks.left.visible) {
      this.stats.activeArm = 'Both Arms';
    } else if (this.smoothedArmLandmarks.right.visible) {
      this.stats.activeArm = 'Right Arm';
    } else if (this.smoothedArmLandmarks.left.visible) {
      this.stats.activeArm = 'Left Arm';
    } else {
      this.stats.activeArm = 'Searching...';
    }

    if (this.onResultsCallback) {
      this.onResultsCallback(this.smoothedArmLandmarks, this.stats);
    }
  }

  /**
   * Generates realistic synthetic arm motions for testing, demonstrations,
   * and fallback when camera is inactive.
   */
  updateDemoMotion() {
    this.demoTime += 0.024;
    const t = this.demoTime;

    // Right Arm: Dynamic bicep curls, flexing, and forearm rotation
    const shoulderR = new THREE.Vector3(0.28, 0.22, -1.4);
    
    // Elbow flexes dynamically (bicep curl rhythm)
    const curlPhase = (Math.sin(t * 1.5) + 1) * 0.5; // 0 (extended) to 1 (flexed)
    const elbowAngle = THREE.MathUtils.lerp(Math.PI * 0.15, Math.PI * 0.65, curlPhase);

    const upperLen = 0.28;
    const foreLen = 0.26;

    // Elbow position
    const elbowR = new THREE.Vector3(
      shoulderR.x + Math.sin(t * 0.5) * 0.04,
      shoulderR.y - upperLen * 0.95,
      shoulderR.z + Math.cos(t * 0.4) * 0.03
    );

    // Wrist positions based on curl angle
    const wristR = new THREE.Vector3(
      elbowR.x + Math.sin(elbowAngle) * foreLen * 0.4 + Math.sin(t * 1.2) * 0.05,
      elbowR.y + Math.cos(elbowAngle) * foreLen + (curlPhase * 0.15),
      elbowR.z + Math.sin(elbowAngle) * foreLen * 0.6
    );

    const handR = wristR.clone().add(new THREE.Vector3(0.02, 0.06, 0.02));

    this.smoothedArmLandmarks.right.shoulder.copy(shoulderR);
    this.smoothedArmLandmarks.right.elbow.copy(elbowR);
    this.smoothedArmLandmarks.right.wrist.copy(wristR);
    this.smoothedArmLandmarks.right.hand.copy(handR);
    this.smoothedArmLandmarks.right.visible = true;
    this.smoothedArmLandmarks.right.confidence = 0.98;

    // Left Arm: Subtle natural stabilization posture
    const shoulderL = new THREE.Vector3(-0.28, 0.22, -1.4);
    const wavePhase = Math.sin(t * 1.1);
    const elbowL = new THREE.Vector3(
      shoulderL.x - 0.06 + wavePhase * 0.03,
      shoulderL.y - upperLen * 0.88,
      shoulderL.z - 0.02
    );
    const wristL = new THREE.Vector3(
      elbowL.x + 0.08 + Math.cos(t * 1.1) * 0.06,
      elbowL.y - foreLen * 0.75,
      elbowL.z + 0.08
    );
    const handL = wristL.clone().add(new THREE.Vector3(-0.02, -0.06, 0.02));

    this.smoothedArmLandmarks.left.shoulder.copy(shoulderL);
    this.smoothedArmLandmarks.left.elbow.copy(elbowL);
    this.smoothedArmLandmarks.left.wrist.copy(wristL);
    this.smoothedArmLandmarks.left.hand.copy(handL);
    this.smoothedArmLandmarks.left.visible = true;
    this.smoothedArmLandmarks.left.confidence = 0.95;

    this.stats.activeArm = 'Demo Simulation (Both Arms)';

    if (this.onResultsCallback) {
      this.onResultsCallback(this.smoothedArmLandmarks, this.stats);
    }
  }

  setMirror(isMirrored) {
    this.isMirrored = isMirrored;
    if (this.video) {
      this.video.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
    }
  }

  setSmoothing(val) {
    this.smoothing = THREE.MathUtils.clamp(val, 0.05, 0.95);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }
}
