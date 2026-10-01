/**
 * Medical Anatomy Database for Human Arm (Upper Extremity)
 * Contains anatomical descriptions, functions, origins, insertions, and clinical notes.
 */

export const ANATOMY_DATABASE = {
  // SKELETAL SYSTEM
  humerus: {
    id: 'humerus',
    name: 'Humerus',
    latinName: 'Os Humeri',
    system: 'Skeletal',
    category: 'bones',
    color: '#e2e8f0',
    description: 'The long bone of the upper arm extending from the shoulder glenoid fossa to the elbow joint.',
    details: {
      articulations: 'Proximally with Glenoid cavity of Scapula; Distally with Radius & Ulna',
      landmarks: 'Humeral Head, Greater & Lesser Tubercles, Deltoid Tuberosity, Medial/Lateral Epicondyles, Trochlea, Capitulum',
      clinicalNote: 'Fractures of the humeral shaft risk damaging the radial nerve in the spiral groove, leading to "wrist drop".'
    }
  },
  radius: {
    id: 'radius',
    name: 'Radius',
    latinName: 'Radius',
    system: 'Skeletal',
    category: 'bones',
    color: '#cbd5e1',
    description: 'The lateral and slightly shorter of the two forearm bones; pivots around the ulna during pronation and supination.',
    details: {
      articulations: 'Proximally with Capitulum of Humerus and Radial Notch of Ulna; Distally with Scaphoid and Lunate carpal bones',
      landmarks: 'Radial Head, Radial Tuberosity, Styloid Process of Radius',
      clinicalNote: 'Colles fracture (distal radius fracture with dorsal displacement) is the most common wrist fracture in adults.'
    }
  },
  ulna: {
    id: 'ulna',
    name: 'Ulna',
    latinName: 'Ulna',
    system: 'Skeletal',
    category: 'bones',
    color: '#cbd5e1',
    description: 'The medial, stabilizing bone of the forearm with a prominent hook-like olecranon forming the point of the elbow.',
    details: {
      articulations: 'Trochlear notch with Trochlea of Humerus; Distally separated from carpal bones by an articular disc',
      landmarks: 'Olecranon Process, Coronoid Process, Trochlear Notch, Ulnar Styloid Process',
      clinicalNote: 'The olecranon process provides attachment for the triceps brachii tendon and bears pressure during elbow resting.'
    }
  },
  elbow_joint: {
    id: 'elbow_joint',
    name: 'Elbow Joint Complex',
    latinName: 'Articulatio Cubiti',
    system: 'Skeletal',
    category: 'bones',
    color: '#94a3b8',
    description: 'Compound synovial hinge joint permitting flexion, extension, and forearm rotational mechanics (supination/pronation).',
    details: {
      components: 'Humeroulnar joint (hinge), Humeroradial joint (gliding/pivot), Proximal radioulnar joint (pivot)',
      ligaments: 'Ulnar Collateral Ligament (UCL), Radial Collateral Ligament (RCL), Annular Ligament',
      clinicalNote: 'Tommy John surgery reconstructs a torn ulnar collateral ligament, commonly injured in baseball pitchers.'
    }
  },
  carpal_bones: {
    id: 'carpal_bones',
    name: 'Carpus & Metacarpals',
    latinName: 'Ossa Carpi et Metacarpalia',
    system: 'Skeletal',
    category: 'bones',
    color: '#94a3b8',
    description: 'Eight carpal wrist bones arranged in two rows, anchoring the five metacarpal rays of the hand.',
    details: {
      carpalBones: 'Scaphoid, Lunate, Triquetrum, Pisiform, Trapezium, Trapezoid, Capitate, Hamate',
      clinicalNote: 'The carpal tunnel is formed by the anterior concave carpal arch bridged by the flexor retinaculum.'
    }
  },

  // MUSCULAR SYSTEM
  biceps_brachii: {
    id: 'biceps_brachii',
    name: 'Biceps Brachii',
    latinName: 'Musculus Biceps Brachii',
    system: 'Muscular',
    category: 'muscles',
    color: '#ef4444',
    description: 'Two-headed anterior arm muscle; powerful flexor and the primary supinator of the forearm.',
    details: {
      origin: 'Long head: Supraglenoid tubercle; Short head: Coracoid process of scapula',
      insertion: 'Radial tuberosity and bicipital aponeurosis into deep fascia of forearm',
      innervation: 'Musculocutaneous nerve (C5, C6)',
      action: 'Forearm supination when flexed; Forearm flexion at elbow; Weak shoulder flexor',
      clinicalNote: 'Rupture of the long head tendon causes a characteristic distal bulge known as the "Popeye deformity".'
    }
  },
  triceps_brachii: {
    id: 'triceps_brachii',
    name: 'Triceps Brachii',
    latinName: 'Musculus Triceps Brachii',
    system: 'Muscular',
    category: 'muscles',
    color: '#dc2626',
    description: 'Large three-headed muscle on the dorsal aspect of the upper arm; primary extensor of the elbow joint.',
    details: {
      origin: 'Long head: Infraglenoid tubercle; Lateral head: Posterior humerus above spiral groove; Medial head: Posterior humerus below spiral groove',
      insertion: 'Olecranon process of ulna',
      innervation: 'Radial nerve (C6, C7, C8)',
      action: 'Chief extensor of the forearm at the elbow; Long head assists in shoulder adduction',
      clinicalNote: 'Triceps reflex (C7 tap) tests integrity of radial nerve and cervical spinal cord segments.'
    }
  },
  deltoid: {
    id: 'deltoid',
    name: 'Deltoid Muscle',
    latinName: 'Musculus Deltoideus',
    system: 'Muscular',
    category: 'muscles',
    color: '#b91c1c',
    description: 'Triangular multipennate muscle capping the shoulder; main abductor of the arm past 15 degrees.',
    details: {
      origin: 'Lateral clavicle, Acromion, and Spine of Scapula',
      insertion: 'Deltoid tuberosity on lateral mid-shaft of Humerus',
      innervation: 'Axillary nerve (C5, C6)',
      action: 'Arm abduction (15°-90°); Anterior fibers flex & medially rotate; Posterior fibers extend & laterally rotate',
      clinicalNote: 'Common intramuscular injection site due to high vascularity and rapid absorption.'
    }
  },
  brachialis: {
    id: 'brachialis',
    name: 'Brachialis',
    latinName: 'Musculus Brachialis',
    system: 'Muscular',
    category: 'muscles',
    color: '#991b1b',
    description: 'Deep anterior arm muscle lying beneath the biceps; the "workhorse" of elbow flexion in all forearm positions.',
    details: {
      origin: 'Distal anterior half of Humerus',
      insertion: 'Coronoid process and tuberosity of Ulna',
      innervation: 'Musculocutaneous nerve (C5, C6) + branch of Radial nerve',
      action: 'Pure flexion of forearm at elbow joint regardless of supination or pronation',
      clinicalNote: 'Unlike biceps, brachialis inserts onto the ulna so forearm rotation does not affect its leverage.'
    }
  },
  brachioradialis: {
    id: 'brachioradialis',
    name: 'Brachioradialis',
    latinName: 'Musculus Brachioradialis',
    system: 'Muscular',
    category: 'muscles',
    color: '#f87171',
    description: 'Superficial muscle on lateral forearm forming the lateral border of the cubital fossa; flexes forearm in mid-prone position.',
    details: {
      origin: 'Proximal two-thirds of lateral supracondylar ridge of Humerus',
      insertion: 'Lateral surface of distal Radius just proximal to styloid process',
      innervation: 'Radial nerve (C5, C6)',
      action: 'Flexes forearm when semi-pronated ("thumbs-up" position); stabilizes elbow during rapid motions',
      clinicalNote: 'Tested during the brachioradialis reflex (C6 reflex arc) by tapping radial styloid.'
    }
  },
  forearm_flexors: {
    id: 'forearm_flexors',
    name: 'Forearm Flexor-Pronator Group',
    latinName: 'Compartimentum Anterius Antebrachii',
    system: 'Muscular',
    category: 'muscles',
    color: '#ef4444',
    description: 'Superficial and deep muscles originating from medial epicondyle; controls wrist and finger flexion.',
    details: {
      muscles: 'Pronator teres, Flexor carpi radialis, Palmaris longus, Flexor carpi ulnaris, Flexor digitorum',
      commonOrigin: 'Medial epicondyle of humerus via Common Flexor Tendon',
      action: 'Wrist flexion, finger flexion, and forearm pronation',
      clinicalNote: 'Medial epicondylitis ("Golfer\'s elbow") results from chronic strain on the common flexor tendon.'
    }
  },

  // VASCULAR SYSTEM
  cephalic_vein: {
    id: 'cephalic_vein',
    name: 'Cephalic Vein',
    latinName: 'Vena Cephalica',
    system: 'Vascular (Venous)',
    category: 'veins',
    color: '#38bdf8',
    description: 'Superficial vein ascending along the lateral margin of forearm and arm, piercing deltopectoral fascia.',
    details: {
      course: 'Originates from radial aspect of dorsal venous network, ascends lateral forearm and biceps groove, empties into Axillary Vein',
      clinicalNote: 'Reliable route for peripheral venous access and placement of pacemakers/cardiac defibrillator leads.'
    }
  },
  basilic_vein: {
    id: 'basilic_vein',
    name: 'Basilic Vein',
    latinName: 'Vena Basilica',
    system: 'Vascular (Venous)',
    category: 'veins',
    color: '#0284c7',
    description: 'Large superficial vein ascending along the medial aspect of the forearm and upper arm.',
    details: {
      course: 'Ascends medially, pierces deep fascia at middle upper arm to unite with brachial veins, forming Axillary Vein',
      clinicalNote: 'Frequently used for creating arteriovenous (AV) fistulas for hemodialysis access in renal patients.'
    }
  },
  median_cubital_vein: {
    id: 'median_cubital_vein',
    name: 'Median Cubital Vein',
    latinName: 'Vena Mediana Cubiti',
    system: 'Vascular (Venous)',
    category: 'veins',
    color: '#06b6d4',
    description: 'Prominent oblique bridging vein in the cubital fossa connecting the cephalic and basilic systems.',
    details: {
      location: 'Superficial to bicipital aponeurosis in antecubital fossa',
      clinicalNote: 'First choice for routine venipuncture (blood draw) and intravenous catheterization worldwide.'
    }
  },
  brachial_artery: {
    id: 'brachial_artery',
    name: 'Brachial Artery',
    latinName: 'Arteria Brachialis',
    system: 'Vascular (Arterial)',
    category: 'arteries',
    color: '#ef4444',
    description: 'Principal blood vessel supplying oxygenated blood to the entire arm and forearm.',
    details: {
      course: 'Continuation of Axillary artery at lower border of teres major; travels down medial bicipital groove; bifurcates at cubital fossa',
      branches: 'Profunda brachii (deep brachial), Superior/Inferior ulnar collateral, divides into Radial & Ulnar arteries',
      clinicalNote: 'Auscultated with a stethoscope during blood pressure measurement at the anterior elbow crease.'
    }
  },
  radial_artery: {
    id: 'radial_artery',
    name: 'Radial Artery',
    latinName: 'Arteria Radialis',
    system: 'Vascular (Arterial)',
    category: 'arteries',
    color: '#f43f5e',
    description: 'Lateral terminal branch of brachial artery; courses down lateral forearm to supply hand.',
    details: {
      course: 'Runs beneath brachioradialis, becomes superficial near wrist lateral to flexor carpi radialis tendon',
      clinicalNote: 'Standard location for palpating peripheral pulse and for arterial blood gas (ABG) sampling and cardiac catheterization.'
    }
  },
  ulnar_artery: {
    id: 'ulnar_artery',
    name: 'Ulnar Artery',
    latinName: 'Arteria Ulnaris',
    system: 'Vascular (Arterial)',
    category: 'arteries',
    color: '#e11d48',
    description: 'Medial terminal branch of brachial artery; larger than radial artery, giving off interosseous branches.',
    details: {
      course: 'Passes deep to pronator teres, travels medially with ulnar nerve, forms Superficial Palmar Arch in hand',
      clinicalNote: 'The Allen test verifies collateral circulation between radial and ulnar arteries prior to radial artery cannulation.'
    }
  },

  // NERVOUS SYSTEM
  median_nerve: {
    id: 'median_nerve',
    name: 'Median Nerve',
    latinName: 'Nervus Medianus',
    system: 'Nervous',
    category: 'nerves',
    color: '#eab308',
    description: 'Major peripheral nerve formed from medial and lateral cords of brachial plexus (C5-T1).',
    details: {
      motorInnervation: 'Most forearm flexors, pronators, and thenar muscles of the thumb (precision grip)',
      sensoryInnervation: 'Palmar skin of thumb, index, middle, and radial half of ring finger',
      clinicalNote: 'Compression in the carpal tunnel under the transverse carpal ligament produces Carpal Tunnel Syndrome.'
    }
  },
  radial_nerve: {
    id: 'radial_nerve',
    name: 'Radial Nerve',
    latinName: 'Nervus Radialis',
    system: 'Nervous',
    category: 'nerves',
    color: '#facc15',
    description: 'Largest branch of brachial plexus; courses in spiral groove of humerus to supply all posterior compartment extensor muscles.',
    details: {
      course: 'Winds around posterior humerus between medial and lateral heads of triceps, enters cubital fossa anteriorly',
      motorInnervation: 'Triceps brachii, Brachioradialis, Extensor carpi radialis, and all wrist/finger extensors',
      clinicalNote: '"Saturday night palsy" occurs when sleeping with arm draped over chair, compressing radial nerve.'
    }
  },
  ulnar_nerve: {
    id: 'ulnar_nerve',
    name: 'Ulnar Nerve',
    latinName: 'Nervus Ulnaris',
    system: 'Nervous',
    category: 'nerves',
    color: '#fde047',
    description: 'Courses posterior to medial epicondyle ("funny bone") down medial forearm into Guyon\'s canal.',
    details: {
      motorInnervation: 'Intrinsic hand muscles (interossei, medial lumbricals), flexor carpi ulnaris (power grip)',
      sensoryInnervation: 'Ulnar 1.5 fingers (little finger and medial half of ring finger)',
      clinicalNote: 'Direct blunt impact at the medial epicondyle causes sharp tingling; chronic entrapment leads to "claw hand".'
    }
  }
};
