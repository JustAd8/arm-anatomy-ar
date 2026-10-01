# BioScan AR — Real-Time 3D Arm Anatomy Overlay

An interactive augmented reality web application that tracks your arms in real-time through your device webcam and generates a high-fidelity 3D anatomical overlay showing **veins, muscles, and bones** structure with dynamic muscle contraction and vascular fluid pulsing.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJustAd8%2Farm-anatomy-ar)

## 🩻 Key Features

- **Live Vision Arm Tracking**: MediaPipe Pose detection with frustum mapping to Three.js 3D coordinates.
- **Temporal Low-Pass Smoothing**: Multi-stage exponential filtering to eliminate webcam landmark jitter while maintaining natural arm responsiveness.
- **Procedural 3D Skeletal Structure**:
  - Shoulder glenoid socket, contoured **Humerus** with flared epicondyles.
  - Spool-shaped elbow trochlea & capitulum.
  - Dual forearm bones: **Ulna** with olecranon beak (elbow point) and **Radius** with discoid radial head and styloid process.
  - Carpal bones cluster and radiating metacarpals.
- **Dynamic Muscular System (Contraction Bulging)**:
  - Fusiform **Biceps Brachii** (long & short heads) with **real-time contraction bulging** that dynamically swells outward during elbow flexion and lengthens upon extension.
  - **Triceps Brachii** (long and lateral heads with olecranon tendon insertion).
  - Deltoid shoulder cap, deep Brachialis, and lateral Brachioradialis.
  - Forearm flexor and extensor compartments.
- **Vascular System (Veins & Arteries with Blood Flow)**:
  - **Superficial Veins**: Cephalic vein, Basilic vein, and **Median Cubital Vein** (the clinical venipuncture site at the elbow crease).
  - **Deep Arteries**: Brachial artery, Radial artery (radial wrist pulse site), and Ulnar artery.
  - Dynamic systolic pulsing wave synchronized with an adjustable heart rate ticker (BPM).
- **Nervous System (Neural Pathways)**:
  - Median nerve (carpal tunnel), Radial nerve (spiral groove), and Ulnar nerve ("funny bone" groove) with action potential electrical spikes.
- **4 Visual Shaders**:
  - *Clinical Realism*: Authentic tissue striations, pearlescent osteo bones, and vascular coloration.
  - *Cyber Hologram*: Glowing neon cyan & magenta HUD wireframe.
  - *Fluoroscopy X-Ray*: Radiographic bone density contrast scan.
  - *Bioluminescence*: Glowing organic filaments.
- **Medical HUD & Biometrics**:
  - Live **Elbow Goniometer** (°).
  - **Biceps Contraction Index** (%).
  - Live Heart Rate Monitor (BPM) with animated ECG wave and auditory heartbeat sound.
  - **3D Interactive Inspector & Anatomy Atlas**: Click or hover any anatomical component to reveal Latin medical names, functions, and clinical correlation notes.
  - **Simulation Mode**: Built-in biomechanical arm motion generator so the app works seamlessly even without a camera.
  - **AR Snapshot Tool**: One-click high-resolution composite photo capture.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Modern browser with WebGL and WebRTC webcam support (Chrome, Edge, Brave, Firefox, Safari)

### Installation

```bash
git clone https://github.com/JustAd8/arm-anatomy-ar.git
cd arm-anatomy-ar
npm install
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Building for Production

```bash
npm run build
```

## 🛠 Tech Stack

- **Three.js** (WebGL 3D Rendering & Procedural Anatomy Rigging)
- **MediaPipe Pose** (Real-time Computer Vision & Kinematic Joint Detection)
- **Vite** (Next-generation frontend tooling)
- **Web Audio API** (Procedural medical telemetry & ECG sound synthesis)
- **Vanilla CSS** (Custom cyberpunk/glassmorphism design system)

## 📄 License

MIT License.
