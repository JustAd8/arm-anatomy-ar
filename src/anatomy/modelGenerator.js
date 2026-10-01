import * as THREE from 'three';
import { ANATOMY_DATABASE } from './anatomyData.js';

/**
 * Creates an anatomical 3D arm model with Bones, Muscles, Veins, Arteries, and Nerves.
 * Supports dynamic deformation, bicep flexion bulging, and real-time landmark tracking.
 */
export class ArmAnatomyModel {
  constructor(armSide = 'right', materialManager) {
    this.armSide = armSide; // 'left' or 'right'
    this.materials = materialManager.materials;
    this.group = new THREE.Group();
    this.group.name = `Arm_${armSide}`;

    // Anatomy subgroups for layer toggles
    this.bonesGroup = new THREE.Group();
    this.musclesGroup = new THREE.Group();
    this.veinsGroup = new THREE.Group();
    this.arteriesGroup = new THREE.Group();
    this.nervesGroup = new THREE.Group();
    this.envelopeGroup = new THREE.Group();

    this.group.add(this.bonesGroup);
    this.group.add(this.musclesGroup);
    this.group.add(this.veinsGroup);
    this.group.add(this.arteriesGroup);
    this.group.add(this.nervesGroup);
    this.group.add(this.envelopeGroup);

    this.interactiveMeshes = [];
    this.armThickness = 1.0;

    // Build the anatomical components
    this.initBones();
    this.initMuscles();
    this.initVessels();
    this.initNerves();
    this.initEnvelope();

    // Cache orientation vectors to avoid garbage collection
    this.vUpper = new THREE.Vector3();
    this.vFore = new THREE.Vector3();
    this.vNormal = new THREE.Vector3();
    this.vAntUpper = new THREE.Vector3();
    this.vAntFore = new THREE.Vector3();
    this.vLatUpper = new THREE.Vector3();
    this.vLatFore = new THREE.Vector3();

    this.tempQuat = new THREE.Quaternion();
    this.yAxis = new THREE.Vector3(0, 1, 0);

    // Dynamic metrics
    this.metrics = {
      elbowAngleDeg: 180,
      contractionPercent: 0,
      upperArmLength: 0.3,
      forearmLength: 0.28
    };
  }

  tagMesh(mesh, anatomyId, partName) {
    mesh.userData = {
      anatomyId,
      partName,
      armSide: this.armSide,
      info: ANATOMY_DATABASE[anatomyId] || null
    };
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    this.interactiveMeshes.push(mesh);
  }

  // -------------------------------------------------------------
  // 1. SKELETAL SYSTEM (BONES)
  // -------------------------------------------------------------
  initBones() {
    const mat = this.materials.bone;
    const cartMat = this.materials.boneCartilage;

    // Shoulder Joint / Humeral Head
    const headGeo = new THREE.SphereGeometry(0.044, 24, 20);
    this.humeralHead = new THREE.Mesh(headGeo, mat);
    this.tagMesh(this.humeralHead, 'humerus', 'Humeral Head (Shoulder)');
    this.bonesGroup.add(this.humeralHead);

    // Clavicle tip / Acromion socket hint
    const acromionGeo = new THREE.TorusGeometry(0.048, 0.012, 12, 24, Math.PI * 1.2);
    this.acromion = new THREE.Mesh(acromionGeo, cartMat);
    this.tagMesh(this.acromion, 'elbow_joint', 'Acromioclavicular Joint');
    this.bonesGroup.add(this.acromion);

    // Humerus Shaft (Upper arm bone)
    // Custom contoured cylinder (narrow mid-shaft, flared ends)
    const humerusGeo = new THREE.CylinderGeometry(0.026, 0.022, 1.0, 20, 8);
    // Taper the humerus anatomically
    const pos = humerusGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      let r = 1.0;
      if (y > 0.3) r = 1.0 + (y - 0.3) * 0.8; // flared proximal head
      else if (y < -0.3) r = 1.0 + (-0.3 - y) * 1.1; // flared epicondyles
      pos.setX(i, pos.getX(i) * r);
      pos.setZ(i, pos.getZ(i) * r);
    }
    humerusGeo.computeVertexNormals();
    this.humerusShaft = new THREE.Mesh(humerusGeo, mat);
    this.tagMesh(this.humerusShaft, 'humerus', 'Humerus Shaft');
    this.bonesGroup.add(this.humerusShaft);

    // Medial & Lateral Epicondyles of Humerus
    const epiGeo = new THREE.SphereGeometry(0.022, 16, 14);
    this.medialEpicondyle = new THREE.Mesh(epiGeo, mat);
    this.tagMesh(this.medialEpicondyle, 'humerus', 'Medial Epicondyle');
    this.bonesGroup.add(this.medialEpicondyle);

    this.lateralEpicondyle = new THREE.Mesh(epiGeo, mat);
    this.tagMesh(this.lateralEpicondyle, 'humerus', 'Lateral Epicondyle');
    this.bonesGroup.add(this.lateralEpicondyle);

    // Elbow Joint (Trochlea & Capitulum spool)
    const elbowGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.065, 16);
    elbowGeo.rotateZ(Math.PI / 2);
    this.elbowJoint = new THREE.Mesh(elbowGeo, cartMat);
    this.tagMesh(this.elbowJoint, 'elbow_joint', 'Trochlea & Capitulum');
    this.bonesGroup.add(this.elbowJoint);

    // Ulna Bone (Medial Forearm Bone with prominent Olecranon beak)
    const ulnaGeo = new THREE.CylinderGeometry(0.016, 0.012, 1.0, 16, 6);
    this.ulnaShaft = new THREE.Mesh(ulnaGeo, mat);
    this.tagMesh(this.ulnaShaft, 'ulna', 'Ulna Bone');
    this.bonesGroup.add(this.ulnaShaft);

    // Olecranon Process (Point of the elbow)
    const olecranonGeo = new THREE.BoxGeometry(0.026, 0.032, 0.032);
    this.olecranon = new THREE.Mesh(olecranonGeo, mat);
    this.tagMesh(this.olecranon, 'ulna', 'Olecranon Process (Elbow Point)');
    this.bonesGroup.add(this.olecranon);

    // Radius Bone (Lateral Forearm Bone with discoid head)
    const radiusGeo = new THREE.CylinderGeometry(0.014, 0.018, 1.0, 16, 6);
    this.radiusShaft = new THREE.Mesh(radiusGeo, mat);
    this.tagMesh(this.radiusShaft, 'radius', 'Radius Bone');
    this.bonesGroup.add(this.radiusShaft);

    // Radial Head (Disc)
    const radHeadGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.015, 16);
    this.radiusHead = new THREE.Mesh(radHeadGeo, cartMat);
    this.tagMesh(this.radiusHead, 'radius', 'Radial Head');
    this.bonesGroup.add(this.radiusHead);

    // Carpal & Metacarpal Group (Wrist & Hand)
    this.handBonesGroup = new THREE.Group();
    // 8 Carpal bones cluster
    const carpalGeo = new THREE.DodecahedronGeometry(0.012);
    for (let c = 0; c < 8; c++) {
      const carpalMesh = new THREE.Mesh(carpalGeo, cartMat);
      carpalMesh.position.set(
        (c % 4 - 1.5) * 0.012,
        (Math.floor(c / 4) - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.008
      );
      this.handBonesGroup.add(carpalMesh);
    }

    // 5 Metacarpal rays
    const metaGeo = new THREE.CylinderGeometry(0.006, 0.007, 0.065, 8);
    for (let m = 0; m < 5; m++) {
      const metaMesh = new THREE.Mesh(metaGeo, mat);
      const angle = (m - 2) * 0.18;
      metaMesh.position.set(Math.sin(angle) * 0.035 + (m - 2) * 0.01, -0.045, Math.cos(angle) * 0.005);
      metaMesh.rotation.z = angle * 0.5;
      this.handBonesGroup.add(metaMesh);
    }
    this.tagMesh(this.handBonesGroup, 'carpal_bones', 'Carpals & Metacarpals');
    this.bonesGroup.add(this.handBonesGroup);
  }

  // -------------------------------------------------------------
  // 2. MUSCULAR SYSTEM (WITH DYNAMIC CONTRACTION BULGING)
  // -------------------------------------------------------------
  initMuscles() {
    const mat = this.materials.muscle;
    const tendonMat = this.materials.tendon;

    // Biceps Brachii - Fusiform bulging muscle belly
    // Long head
    const bicepLongGeo = new THREE.SphereGeometry(0.034, 18, 16);
    bicepLongGeo.scale(0.85, 2.4, 0.85);
    this.bicepsLong = new THREE.Mesh(bicepLongGeo, mat);
    this.tagMesh(this.bicepsLong, 'biceps_brachii', 'Biceps Brachii (Long Head)');
    this.musclesGroup.add(this.bicepsLong);

    // Short head
    const bicepShortGeo = new THREE.SphereGeometry(0.032, 18, 16);
    bicepShortGeo.scale(0.8, 2.2, 0.8);
    this.bicepsShort = new THREE.Mesh(bicepShortGeo, mat);
    this.tagMesh(this.bicepsShort, 'biceps_brachii', 'Biceps Brachii (Short Head)');
    this.musclesGroup.add(this.bicepsShort);

    // Bicipital tendon inserting onto radial tuberosity
    const bicepTendonGeo = new THREE.CylinderGeometry(0.007, 0.009, 0.08, 10);
    this.bicepTendon = new THREE.Mesh(bicepTendonGeo, tendonMat);
    this.tagMesh(this.bicepTendon, 'biceps_brachii', 'Distal Biceps Tendon');
    this.musclesGroup.add(this.bicepTendon);

    // Triceps Brachii - Posterior Upper Arm
    // Lateral head
    const tricepLatGeo = new THREE.SphereGeometry(0.032, 16, 14);
    tricepLatGeo.scale(0.8, 2.2, 0.7);
    this.tricepsLateral = new THREE.Mesh(tricepLatGeo, mat);
    this.tagMesh(this.tricepsLateral, 'triceps_brachii', 'Triceps Brachii (Lateral Head)');
    this.musclesGroup.add(this.tricepsLateral);

    // Long head
    const tricepLongGeo = new THREE.SphereGeometry(0.034, 16, 14);
    tricepLongGeo.scale(0.85, 2.4, 0.75);
    this.tricepsLong = new THREE.Mesh(tricepLongGeo, mat);
    this.tagMesh(this.tricepsLong, 'triceps_brachii', 'Triceps Brachii (Long Head)');
    this.musclesGroup.add(this.tricepsLong);

    // Triceps Aponeurosis / Tendon to Olecranon
    const tricepTendonGeo = new THREE.CylinderGeometry(0.015, 0.012, 0.07, 10);
    this.tricepTendon = new THREE.Mesh(tricepTendonGeo, tendonMat);
    this.tagMesh(this.tricepTendon, 'triceps_brachii', 'Common Triceps Tendon');
    this.musclesGroup.add(this.tricepTendon);

    // Deltoid Muscle - Shoulder Cap
    const deltoidGeo = new THREE.ConeGeometry(0.065, 0.14, 16, 1, true);
    deltoidGeo.rotateX(Math.PI);
    this.deltoid = new THREE.Mesh(deltoidGeo, mat);
    this.tagMesh(this.deltoid, 'deltoid', 'Deltoid Muscle');
    this.musclesGroup.add(this.deltoid);

    // Brachialis Muscle - Deep Anterior Flexor
    const brachialisGeo = new THREE.SphereGeometry(0.026, 14, 12);
    brachialisGeo.scale(0.8, 1.8, 0.8);
    this.brachialis = new THREE.Mesh(brachialisGeo, mat);
    this.tagMesh(this.brachialis, 'brachialis', 'Brachialis Muscle');
    this.musclesGroup.add(this.brachialis);

    // Brachioradialis - Lateral Forearm Ridge
    const brachioradGeo = new THREE.SphereGeometry(0.028, 16, 14);
    brachioradGeo.scale(0.7, 2.6, 0.7);
    this.brachioradialis = new THREE.Mesh(brachioradGeo, mat);
    this.tagMesh(this.brachioradialis, 'brachioradialis', 'Brachioradialis Muscle');
    this.musclesGroup.add(this.brachioradialis);

    // Forearm Flexor Mass (Anterior / Medial)
    const flexorGeo = new THREE.ConeGeometry(0.035, 0.22, 14);
    flexorGeo.rotateX(Math.PI);
    this.forearmFlexors = new THREE.Mesh(flexorGeo, mat);
    this.tagMesh(this.forearmFlexors, 'forearm_flexors', 'Forearm Flexor Compartment');
    this.musclesGroup.add(this.forearmFlexors);

    // Forearm Extensor Mass (Posterior / Lateral)
    const extensorGeo = new THREE.ConeGeometry(0.032, 0.20, 14);
    extensorGeo.rotateX(Math.PI);
    this.forearmExtensors = new THREE.Mesh(extensorGeo, mat);
    this.tagMesh(this.forearmExtensors, 'forearm_flexors', 'Forearm Extensor Compartment');
    this.musclesGroup.add(this.forearmExtensors);
  }

  // -------------------------------------------------------------
  // 3. VASCULAR SYSTEM (VEINS & ARTERIES WITH BLOOD FLOW)
  // -------------------------------------------------------------
  initVessels() {
    const veinMat = this.materials.vein;
    const artMat = this.materials.artery;

    // Helper to generate dynamic tube meshes
    const makeTube = (points, radius, material, id, name, parentGroup) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 32, radius, 8, false);
      const mesh = new THREE.Mesh(geo, material);
      this.tagMesh(mesh, id, name);
      parentGroup.add(mesh);
      return { mesh, points, radius, curve };
    };

    // Default reference points for upper arm and forearm paths
    // Cephalic Vein: Lateral hand -> lateral forearm -> cubital crease -> lateral biceps -> deltopectoral groove
    const cephPoints = [
      new THREE.Vector3(0.035, 0.45, 0.01),  // Deltopectoral groove
      new THREE.Vector3(0.042, 0.25, 0.015), // Lateral biceps
      new THREE.Vector3(0.032, 0.02, 0.018), // Anterolateral elbow
      new THREE.Vector3(0.028, -0.15, 0.015), // Lateral forearm
      new THREE.Vector3(0.025, -0.28, 0.01)   // Radial wrist
    ];
    this.cephalicVein = makeTube(cephPoints, 0.0042, veinMat, 'cephalic_vein', 'Cephalic Vein', this.veinsGroup);

    // Basilic Vein: Medial wrist -> medial forearm -> medial elbow -> medial biceps
    const basilPoints = [
      new THREE.Vector3(-0.028, 0.35, 0.005),  // Medial upper arm
      new THREE.Vector3(-0.035, 0.15, 0.01),   // Medial bicipital groove
      new THREE.Vector3(-0.032, -0.02, 0.012), // Medial elbow
      new THREE.Vector3(-0.025, -0.16, 0.01),  // Medial forearm
      new THREE.Vector3(-0.020, -0.28, 0.008)  // Ulnar wrist
    ];
    this.basilicVein = makeTube(basilPoints, 0.0040, veinMat, 'basilic_vein', 'Basilic Vein', this.veinsGroup);

    // Median Cubital Vein: Oblique connection at elbow crease (venipuncture site!)
    const cubitalPoints = [
      new THREE.Vector3(0.028, 0.015, 0.022),   // Connecting to Cephalic
      new THREE.Vector3(0.0, 0.00, 0.025),      // Center of cubital fossa
      new THREE.Vector3(-0.026, -0.02, 0.02)   // Connecting to Basilic
    ];
    this.medianCubitalVein = makeTube(cubitalPoints, 0.0045, veinMat, 'median_cubital_vein', 'Median Cubital Vein (Venipuncture Site)', this.veinsGroup);

    // Dorsal Venous Network (Hand)
    const handVeinPoints = [
      new THREE.Vector3(0.02, -0.28, 0.01),
      new THREE.Vector3(0.01, -0.33, 0.012),
      new THREE.Vector3(-0.015, -0.34, 0.011),
      new THREE.Vector3(-0.02, -0.28, 0.008)
    ];
    this.handVeins = makeTube(handVeinPoints, 0.0028, veinMat, 'cephalic_vein', 'Dorsal Venous Arch', this.veinsGroup);

    // ARTERIES:
    // Brachial Artery: Medial bicipital groove of upper arm to cubital fossa
    const brachArtPoints = [
      new THREE.Vector3(-0.018, 0.42, -0.005),
      new THREE.Vector3(-0.022, 0.22, 0.002),
      new THREE.Vector3(-0.015, 0.04, 0.008),
      new THREE.Vector3(0.0, -0.02, 0.01) // Bifurcation point
    ];
    this.brachialArtery = makeTube(brachArtPoints, 0.0048, artMat, 'brachial_artery', 'Brachial Artery (Pulse Auscultation)', this.arteriesGroup);

    // Radial Artery: Bifurcation down lateral forearm to radial wrist pulse point
    const radArtPoints = [
      new THREE.Vector3(0.0, -0.02, 0.01),
      new THREE.Vector3(0.018, -0.12, 0.008),
      new THREE.Vector3(0.022, -0.22, 0.008),
      new THREE.Vector3(0.024, -0.28, 0.009) // Radial pulse palpation point
    ];
    this.radialArtery = makeTube(radArtPoints, 0.0036, artMat, 'radial_artery', 'Radial Artery (Wrist Pulse Site)', this.arteriesGroup);

    // Ulnar Artery: Bifurcation down medial forearm
    const ulnarArtPoints = [
      new THREE.Vector3(0.0, -0.02, 0.01),
      new THREE.Vector3(-0.015, -0.14, 0.005),
      new THREE.Vector3(-0.018, -0.24, 0.006),
      new THREE.Vector3(-0.016, -0.28, 0.007)
    ];
    this.ulnarArtery = makeTube(ulnarArtPoints, 0.0038, artMat, 'ulnar_artery', 'Ulnar Artery', this.arteriesGroup);
  }

  // -------------------------------------------------------------
  // 4. NERVOUS SYSTEM (NEURAL PATHWAYS)
  // -------------------------------------------------------------
  initNerves() {
    const nerveMat = this.materials.nerve;

    const makeNerveTube = (points, radius, id, name) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 24, radius, 6, false);
      const mesh = new THREE.Mesh(geo, nerveMat);
      this.tagMesh(mesh, id, name);
      this.nervesGroup.add(mesh);
      return { mesh, points, radius, curve };
    };

    // Median Nerve (Courses down anterior center of arm through carpal tunnel)
    const medianPoints = [
      new THREE.Vector3(-0.01, 0.40, 0.0),
      new THREE.Vector3(-0.01, 0.20, 0.008),
      new THREE.Vector3(0.005, 0.00, 0.012),
      new THREE.Vector3(0.002, -0.18, 0.008),
      new THREE.Vector3(0.0, -0.28, 0.006) // Carpal tunnel
    ];
    this.medianNerve = makeNerveTube(medianPoints, 0.0025, 'median_nerve', 'Median Nerve (Carpal Tunnel)');

    // Radial Nerve (Spirals around posterior humerus to lateral forearm)
    const radialPoints = [
      new THREE.Vector3(-0.01, 0.42, -0.01),
      new THREE.Vector3(0.01, 0.25, -0.02), // Spiral groove
      new THREE.Vector3(0.028, 0.08, -0.005),
      new THREE.Vector3(0.026, -0.12, 0.002),
      new THREE.Vector3(0.022, -0.26, 0.004)
    ];
    this.radialNerve = makeNerveTube(radialPoints, 0.0026, 'radial_nerve', 'Radial Nerve (Spiral Groove)');

    // Ulnar Nerve (Passes behind medial epicondyle - "funny bone")
    const ulnarPoints = [
      new THREE.Vector3(-0.02, 0.38, -0.005),
      new THREE.Vector3(-0.028, 0.18, -0.01),
      new THREE.Vector3(-0.034, -0.01, -0.018), // Behind medial epicondyle!
      new THREE.Vector3(-0.022, -0.16, -0.005),
      new THREE.Vector3(-0.018, -0.28, 0.002) // Guyon's canal
    ];
    this.ulnarNerve = makeNerveTube(ulnarPoints, 0.0025, 'ulnar_nerve', 'Ulnar Nerve ("Funny Bone" Groove)');
  }

  // -------------------------------------------------------------
  // 5. HOLOGRAPHIC ARM ENVELOPE (AR CONTOUR)
  // -------------------------------------------------------------
  initEnvelope() {
    const envMat = this.materials.envelope;

    // Upper arm contour capsule
    const upperEnvGeo = new THREE.CylinderGeometry(0.052, 0.046, 1.0, 18, 4, true);
    this.upperArmEnvelope = new THREE.Mesh(upperEnvGeo, envMat);
    this.envelopeGroup.add(this.upperArmEnvelope);

    // Forearm contour capsule
    const foreEnvGeo = new THREE.CylinderGeometry(0.046, 0.034, 1.0, 18, 4, true);
    this.forearmEnvelope = new THREE.Mesh(foreEnvGeo, envMat);
    this.envelopeGroup.add(this.forearmEnvelope);
  }

  // -------------------------------------------------------------
  // DYNAMIC LIVE TRACKING UPDATE METHOD
  // -------------------------------------------------------------
  /**
   * Updates all 3D anatomical components based on real-time landmarks.
   * @param {THREE.Vector3} shoulder World/Camera 3D coordinate of shoulder
   * @param {THREE.Vector3} elbow World/Camera 3D coordinate of elbow
   * @param {THREE.Vector3} wrist World/Camera 3D coordinate of wrist
   * @param {THREE.Vector3} hand World/Camera 3D coordinate of hand/fingers
   * @param {Object} options Visual/Scaling options
   */
  updatePose(shoulder, elbow, wrist, hand, options = {}) {
    const isRight = this.armSide === 'right';
    const sideMultiplier = isRight ? 1 : -1;
    const thickness = (options.armThickness || 1.0) * this.armThickness;

    // Vectors between tracked joints
    this.vUpper.subVectors(elbow, shoulder);
    this.vFore.subVectors(wrist, elbow);

    const lenUpper = this.vUpper.length();
    const lenFore = this.vFore.length();

    if (lenUpper < 0.01 || lenFore < 0.01) return;

    this.metrics.upperArmLength = lenUpper;
    this.metrics.forearmLength = lenFore;

    // Midpoints
    const midUpper = new THREE.Vector3().addVectors(shoulder, elbow).multiplyScalar(0.5);
    const midFore = new THREE.Vector3().addVectors(elbow, wrist).multiplyScalar(0.5);

    // Arm flexion plane normal: N = V_upper x V_fore
    this.vNormal.crossVectors(this.vUpper, this.vFore);
    const normLen = this.vNormal.length();

    if (normLen > 0.001) {
      this.vNormal.normalize();
    } else {
      // Arms straight: fallback normal
      this.vNormal.set(0, 0, 1);
    }

    // Anterior direction (towards biceps & elbow crease)
    this.vAntUpper.crossVectors(this.vNormal, this.vUpper).normalize().multiplyScalar(sideMultiplier);
    this.vAntFore.crossVectors(this.vNormal, this.vFore).normalize().multiplyScalar(sideMultiplier);

    // Lateral direction (pointing away from torso)
    this.vLatUpper.crossVectors(this.vUpper, this.vAntUpper).normalize();
    this.vLatFore.crossVectors(this.vFore, this.vAntFore).normalize();

    // Elbow flexion angle
    const dot = this.vUpper.clone().normalize().dot(this.vFore.clone().normalize());
    const angleRad = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));
    const angleDeg = THREE.MathUtils.radToDeg(angleRad);
    this.metrics.elbowAngleDeg = Math.round(angleDeg);

    // Contraction index: 0% when straight (180 deg), 100% when fully curled (45 deg)
    const contraction = THREE.MathUtils.clamp((180 - angleDeg) / 125, 0, 1);
    this.metrics.contractionPercent = Math.round(contraction * 100);

    // Bicep dynamic bulging factor (up to 1.65x thickness during peak flexion)
    const bicepBulge = 1.0 + 0.65 * contraction * thickness;
    const tricepStretch = 1.0 - 0.25 * contraction;

    // ---------------------------------------------------------
    // Position Bones
    // ---------------------------------------------------------
    // Shoulder & Humeral Head
    this.humeralHead.position.copy(shoulder);
    this.humeralHead.scale.set(thickness, thickness, thickness);

    this.acromion.position.copy(shoulder);
    this.acromion.lookAt(elbow);

    // Humerus Shaft: positioned at midUpper, oriented along vUpper
    this.humerusShaft.position.copy(midUpper);
    this.humerusShaft.scale.set(thickness, lenUpper, thickness);
    this.tempQuat.setFromUnitVectors(this.yAxis, this.vUpper.clone().normalize());
    this.humerusShaft.quaternion.copy(this.tempQuat);

    // Epicondyles at distal humerus (elbow region)
    const epicondyleOffset = this.vLatUpper.clone().multiplyScalar(0.026 * thickness);
    this.lateralEpicondyle.position.copy(elbow).add(epicondyleOffset);
    this.medialEpicondyle.position.copy(elbow).sub(epicondyleOffset);

    // Elbow Joint spool
    this.elbowJoint.position.copy(elbow);
    this.elbowJoint.quaternion.copy(this.tempQuat);

    // Forearm orientation
    const foreQuat = new THREE.Quaternion().setFromUnitVectors(this.yAxis, this.vFore.clone().normalize());

    // Ulna (Medial side of forearm)
    const ulnaOffset = this.vLatFore.clone().multiplyScalar(-0.016 * thickness);
    this.ulnaShaft.position.copy(midFore).add(ulnaOffset);
    this.ulnaShaft.scale.set(thickness, lenFore, thickness);
    this.ulnaShaft.quaternion.copy(foreQuat);

    // Olecranon process at elbow posterior
    const olecranonOffset = this.vAntUpper.clone().multiplyScalar(-0.022 * thickness);
    this.olecranon.position.copy(elbow).add(olecranonOffset);

    // Radius (Lateral side of forearm)
    const radiusOffset = this.vLatFore.clone().multiplyScalar(0.016 * thickness);
    this.radiusShaft.position.copy(midFore).add(radiusOffset);
    this.radiusShaft.scale.set(thickness, lenFore, thickness);
    this.radiusShaft.quaternion.copy(foreQuat);

    this.radiusHead.position.copy(elbow).add(radiusOffset);
    this.radiusHead.quaternion.copy(foreQuat);

    // Wrist / Hand bones
    this.handBonesGroup.position.copy(wrist);
    if (hand && hand.length() > 0.01) {
      const vHand = new THREE.Vector3().subVectors(hand, wrist).normalize();
      const handQuat = new THREE.Quaternion().setFromUnitVectors(this.yAxis.clone().negate(), vHand);
      this.handBonesGroup.quaternion.copy(handQuat);
    } else {
      this.handBonesGroup.quaternion.copy(foreQuat);
    }

    // ---------------------------------------------------------
    // Position Muscles (With Dynamic Contraction Bulge)
    // ---------------------------------------------------------
    // Biceps Brachii: anterior upper arm
    const bicepForwardOffset = this.vAntUpper.clone().multiplyScalar((0.028 + 0.018 * contraction) * thickness);
    const bicepLateralOffset = this.vLatUpper.clone().multiplyScalar(0.012 * thickness);

    // Long head (slightly lateral)
    this.bicepsLong.position.copy(midUpper).add(bicepForwardOffset).add(bicepLateralOffset);
    this.bicepsLong.scale.set(bicepBulge * thickness, (lenUpper * 0.48) / 0.07, bicepBulge * thickness);
    this.bicepsLong.quaternion.copy(this.tempQuat);

    // Short head (slightly medial)
    this.bicepsShort.position.copy(midUpper).add(bicepForwardOffset).sub(bicepLateralOffset);
    this.bicepsShort.scale.set(bicepBulge * 0.95 * thickness, (lenUpper * 0.44) / 0.07, bicepBulge * 0.95 * thickness);
    this.bicepsShort.quaternion.copy(this.tempQuat);

    // Distal Bicep Tendon
    const tendonPos = elbow.clone().add(this.vAntUpper.clone().multiplyScalar(0.015 * thickness));
    this.bicepTendon.position.copy(tendonPos);
    this.bicepTendon.quaternion.copy(this.tempQuat);

    // Triceps Brachii: posterior upper arm
    const tricepBackOffset = this.vAntUpper.clone().multiplyScalar(-0.026 * tricepStretch * thickness);
    this.tricepsLong.position.copy(midUpper).add(tricepBackOffset);
    this.tricepsLong.scale.set(tricepStretch * thickness, (lenUpper * 0.5) / 0.07, tricepStretch * thickness);
    this.tricepsLong.quaternion.copy(this.tempQuat);

    this.tricepsLateral.position.copy(midUpper).add(tricepBackOffset).add(bicepLateralOffset);
    this.tricepsLateral.scale.set(tricepStretch * 0.9 * thickness, (lenUpper * 0.45) / 0.07, tricepStretch * 0.9 * thickness);
    this.tricepsLateral.quaternion.copy(this.tempQuat);

    // Tricep Tendon
    this.tricepTendon.position.copy(elbow).add(this.vAntUpper.clone().multiplyScalar(-0.02 * thickness));
    this.tricepTendon.quaternion.copy(this.tempQuat);

    // Deltoid
    this.deltoid.position.copy(shoulder);
    this.deltoid.scale.set(thickness, lenUpper * 0.35 / 0.14, thickness);
    this.deltoid.quaternion.copy(this.tempQuat);

    // Brachialis
    const brachialisPos = elbow.clone().add(this.vUpper.clone().normalize().multiplyScalar(-lenUpper * 0.3)).add(this.vAntUpper.clone().multiplyScalar(0.018 * thickness));
    this.brachialis.position.copy(brachialisPos);
    this.brachialis.scale.set(thickness, (lenUpper * 0.3) / 0.05, thickness);
    this.brachialis.quaternion.copy(this.tempQuat);

    // Forearm Muscles: Brachioradialis, Flexors, Extensors
    const brachioradPos = elbow.clone().add(this.vLatFore.clone().multiplyScalar(0.03 * thickness)).add(this.vFore.clone().normalize().multiplyScalar(lenFore * 0.35));
    this.brachioradialis.position.copy(brachioradPos);
    this.brachioradialis.scale.set(thickness, (lenFore * 0.5) / 0.07, thickness);
    this.brachioradialis.quaternion.copy(foreQuat);

    const flexorPos = midFore.clone().add(this.vAntFore.clone().multiplyScalar(0.02 * thickness)).sub(this.vLatFore.clone().multiplyScalar(0.012 * thickness));
    this.forearmFlexors.position.copy(flexorPos);
    this.forearmFlexors.scale.set(thickness, (lenFore * 0.6) / 0.22, thickness);
    this.forearmFlexors.quaternion.copy(foreQuat);

    const extensorPos = midFore.clone().sub(this.vAntFore.clone().multiplyScalar(0.018 * thickness)).add(this.vLatFore.clone().multiplyScalar(0.014 * thickness));
    this.forearmExtensors.position.copy(extensorPos);
    this.forearmExtensors.scale.set(thickness, (lenFore * 0.55) / 0.20, thickness);
    this.forearmExtensors.quaternion.copy(foreQuat);

    // ---------------------------------------------------------
    // Dynamic Vessels & Nerves Deformation
    // ---------------------------------------------------------
    this.updateVesselGeometry(this.cephalicVein, [
      shoulder.clone().add(this.vLatUpper.clone().multiplyScalar(0.045 * thickness)),
      midUpper.clone().add(this.vLatUpper.clone().multiplyScalar(0.042 * thickness)).add(this.vAntUpper.clone().multiplyScalar(0.018 * thickness)),
      elbow.clone().add(this.vLatUpper.clone().multiplyScalar(0.035 * thickness)).add(this.vAntUpper.clone().multiplyScalar(0.022 * thickness)),
      midFore.clone().add(this.vLatFore.clone().multiplyScalar(0.032 * thickness)).add(this.vAntFore.clone().multiplyScalar(0.015 * thickness)),
      wrist.clone().add(this.vLatFore.clone().multiplyScalar(0.025 * thickness))
    ]);

    this.updateVesselGeometry(this.basilicVein, [
      shoulder.clone().sub(this.vLatUpper.clone().multiplyScalar(0.032 * thickness)),
      midUpper.clone().sub(this.vLatUpper.clone().multiplyScalar(0.038 * thickness)).add(this.vAntUpper.clone().multiplyScalar(0.01 * thickness)),
      elbow.clone().sub(this.vLatUpper.clone().multiplyScalar(0.035 * thickness)).add(this.vAntUpper.clone().multiplyScalar(0.015 * thickness)),
      midFore.clone().sub(this.vLatFore.clone().multiplyScalar(0.028 * thickness)).add(this.vAntFore.clone().multiplyScalar(0.012 * thickness)),
      wrist.clone().sub(this.vLatFore.clone().multiplyScalar(0.022 * thickness))
    ]);

    // Median Cubital Vein (Cross-connection at anterior elbow crease)
    const cephElbow = elbow.clone().add(this.vLatUpper.clone().multiplyScalar(0.035 * thickness)).add(this.vAntUpper.clone().multiplyScalar(0.024 * thickness));
    const basilElbow = elbow.clone().sub(this.vLatUpper.clone().multiplyScalar(0.032 * thickness)).add(this.vAntUpper.clone().multiplyScalar(0.02 * thickness));
    const cubitalMid = elbow.clone().add(this.vAntUpper.clone().multiplyScalar(0.028 * thickness));
    this.updateVesselGeometry(this.medianCubitalVein, [cephElbow, cubitalMid, basilElbow]);

    // Brachial Artery
    this.updateVesselGeometry(this.brachialArtery, [
      shoulder.clone().sub(this.vLatUpper.clone().multiplyScalar(0.018 * thickness)),
      midUpper.clone().sub(this.vLatUpper.clone().multiplyScalar(0.022 * thickness)).add(this.vAntUpper.clone().multiplyScalar(0.005 * thickness)),
      elbow.clone().add(this.vAntUpper.clone().multiplyScalar(0.01 * thickness))
    ]);

    // Radial Artery
    this.updateVesselGeometry(this.radialArtery, [
      elbow.clone().add(this.vAntUpper.clone().multiplyScalar(0.01 * thickness)),
      midFore.clone().add(this.vLatFore.clone().multiplyScalar(0.022 * thickness)).add(this.vAntFore.clone().multiplyScalar(0.01 * thickness)),
      wrist.clone().add(this.vLatFore.clone().multiplyScalar(0.024 * thickness)).add(this.vAntFore.clone().multiplyScalar(0.012 * thickness))
    ]);

    // Ulnar Artery
    this.updateVesselGeometry(this.ulnarArtery, [
      elbow.clone().add(this.vAntUpper.clone().multiplyScalar(0.01 * thickness)),
      midFore.clone().sub(this.vLatFore.clone().multiplyScalar(0.018 * thickness)).add(this.vAntFore.clone().multiplyScalar(0.008 * thickness)),
      wrist.clone().sub(this.vLatFore.clone().multiplyScalar(0.016 * thickness))
    ]);

    // Median Nerve
    this.updateVesselGeometry(this.medianNerve, [
      shoulder.clone().sub(this.vLatUpper.clone().multiplyScalar(0.01 * thickness)),
      midUpper.clone().add(this.vAntUpper.clone().multiplyScalar(0.008 * thickness)),
      elbow.clone().add(this.vAntUpper.clone().multiplyScalar(0.012 * thickness)),
      midFore.clone().add(this.vAntFore.clone().multiplyScalar(0.01 * thickness)),
      wrist.clone().add(this.vAntFore.clone().multiplyScalar(0.008 * thickness))
    ]);

    // Radial Nerve
    this.updateVesselGeometry(this.radialNerve, [
      shoulder.clone().sub(this.vLatUpper.clone().multiplyScalar(0.01 * thickness)),
      midUpper.clone().sub(this.vAntUpper.clone().multiplyScalar(0.018 * thickness)).add(this.vLatUpper.clone().multiplyScalar(0.015 * thickness)),
      elbow.clone().add(this.vLatUpper.clone().multiplyScalar(0.03 * thickness)),
      midFore.clone().add(this.vLatFore.clone().multiplyScalar(0.02 * thickness)),
      wrist.clone().add(this.vLatFore.clone().multiplyScalar(0.015 * thickness))
    ]);

    // Ulnar Nerve (runs behind medial epicondyle)
    this.updateVesselGeometry(this.ulnarNerve, [
      shoulder.clone().sub(this.vLatUpper.clone().multiplyScalar(0.02 * thickness)),
      midUpper.clone().sub(this.vLatUpper.clone().multiplyScalar(0.025 * thickness)),
      elbow.clone().sub(this.vLatUpper.clone().multiplyScalar(0.035 * thickness)).sub(this.vAntUpper.clone().multiplyScalar(0.02 * thickness)),
      midFore.clone().sub(this.vLatFore.clone().multiplyScalar(0.02 * thickness)),
      wrist.clone().sub(this.vLatFore.clone().multiplyScalar(0.015 * thickness))
    ]);

    // ---------------------------------------------------------
    // Arm Hologram Envelope
    // ---------------------------------------------------------
    this.upperArmEnvelope.position.copy(midUpper);
    this.upperArmEnvelope.scale.set(thickness, lenUpper, thickness);
    this.upperArmEnvelope.quaternion.copy(this.tempQuat);

    this.forearmEnvelope.position.copy(midFore);
    this.forearmEnvelope.scale.set(thickness, lenFore, thickness);
    this.forearmEnvelope.quaternion.copy(foreQuat);
  }

  updateVesselGeometry(vesselObj, newPoints) {
    if (!vesselObj || !vesselObj.mesh) return;
    vesselObj.curve.points = newPoints;
    const newGeo = new THREE.TubeGeometry(vesselObj.curve, 24, vesselObj.radius, 8, false);
    vesselObj.mesh.geometry.dispose();
    vesselObj.mesh.geometry = newGeo;
  }

  setArmThickness(multiplier) {
    this.armThickness = multiplier;
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
