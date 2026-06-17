export type Subject = {
  id: string;
  name: string;
  color: string;
  topics: string[];
  allowedEmails: string[];
  units?: CourseUnit[];
};

export type CourseUnit = {
  id: string;
  title: string;
  topicCount: number;
  revisionNoteCount: number;
  topics: string[];
  allowedEmails?: string[];
  topicItems?: CourseTopic[];
};

export type CourseTopic = {
  id: string;
  title: string;
  subtopics: CourseSubtopic[];
};

export type CourseSubtopic = {
  id: string;
  title: string;
  driveUrl: string;
};

export type Lesson = {
  id: string;
  title: string;
  subjectId: string;
  topic: string;
  date: string;
  duration: string;
  driveUrl: string;
  description: string;
};

export const subjectsSeed: Subject[] = [
  {
    id: "maths",
    name: "Mathematics",
    color: "#2563eb",
    topics: ["Pure Mathematics", "Statistics", "Mechanics"],
    allowedEmails: []
  },
  {
    id: "physics",
    name: "Physics IGCSE",
    color: "#059669",
    allowedEmails: [],
    topics: [
      "Unit 1: Forces and Motion",
      "Forces and Motion",
      "Electricity",
      "Waves",
      "Energy Resources and Transfers",
      "Solids, Liquids and Gases",
      "Magnetism and Electromagnetism",
      "Radioactivity and Particles",
      "Astrophysics"
    ]
  },
  {
    id: "edexcel-ial-physics",
    name: "Edexcel IAL Physics",
    color: "#7c3aed",
    allowedEmails: [],
    topics: [
      "AS - Unit 1",
      "AS - Unit 2",
      "AS - Unit 3",
      "A2 - Unit 4",
      "A2 - Unit 5",
      "A2 - Unit 6",
      "Motion",
      "Forces & Momentum",
      "Moments",
      "Work, Energy & Power",
      "Density, Upthrust & Viscous Drag",
      "Stretching Materials"
    ],
    units: [
      {
        id: "ial-physics-unit-1",
        title: "1. Mechanics & Materials",
        topicCount: 6,
        revisionNoteCount: 32,
        topics: [
          "Motion",
          "Forces & Momentum",
          "Moments",
          "Work, Energy & Power",
          "Density, Upthrust & Viscous Drag",
          "Stretching Materials"
        ]
      },
      {
        id: "ial-physics-unit-2",
        title: "2. Waves & Electricity",
        topicCount: 8,
        revisionNoteCount: 51,
        topics: []
      },
      {
        id: "ial-physics-unit-3",
        title: "3. Practical Skills in Physics I",
        topicCount: 3,
        revisionNoteCount: 25,
        topics: []
      },
      {
        id: "ial-physics-unit-4",
        title: "4. Further Mechanics, Fields & Particles",
        topicCount: 7,
        revisionNoteCount: 44,
        topics: []
      },
      {
        id: "ial-physics-unit-5",
        title: "5. Thermodynamics, Radiation, Oscillations & Cosmology",
        topicCount: 10,
        revisionNoteCount: 47,
        topics: []
      },
      {
        id: "ial-physics-unit-6",
        title: "6. Practical Skills in Physics II",
        topicCount: 3,
        revisionNoteCount: 23,
        topics: []
      }
    ]
  },
  {
    id: "it",
    name: "IT",
    color: "#dc2626",
    topics: ["Unit 1: Digital Devices", "Unit 2: Connectivity", "Unit 3: Software and Data"],
    allowedEmails: []
  }
];

export const lessonsSeed: Lesson[] = [
  {
    id: "maths-pure-functions",
    title: "Pure Maths: Functions and Transformations",
    subjectId: "maths",
    topic: "Pure Mathematics",
    date: "2026-06-02",
    duration: "62 min",
    driveUrl: "https://drive.google.com/file/d/1Qw3Xh4ExampleRecordingId/preview",
    description: "Core function notation, transformations, inverse functions, and exam-style examples."
  },
  {
    id: "physics-electric-circuits",
    title: "Physics IGCSE: Electric Circuits Revision",
    subjectId: "physics",
    topic: "Electricity",
    date: "2026-06-08",
    duration: "54 min",
    driveUrl: "https://drive.google.com/file/d/1CircuitExampleRecordingId/preview",
    description: "Circuit symbols, Kirchhoff laws, resistance questions, and practical graph analysis."
  },
  {
    id: "physics-forces-motion",
    title: "Physics IGCSE: Forces and Motion",
    subjectId: "physics",
    topic: "Unit 1: Forces and Motion",
    date: "2026-06-10",
    duration: "50 min",
    driveUrl: "https://drive.google.com/file/d/1ForcesExampleRecordingId/preview",
    description: "Speed-time graphs, acceleration, Newton's laws, stopping distances, and momentum."
  },
  {
    id: "physics-waves-light",
    title: "Physics IGCSE: Waves and Light",
    subjectId: "physics",
    topic: "Waves",
    date: "2026-06-14",
    duration: "52 min",
    driveUrl: "https://drive.google.com/file/d/1WavesExampleRecordingId/preview",
    description: "Wave properties, reflection, refraction, lenses, sound, and electromagnetic waves."
  },
  {
    id: "it-digital-devices",
    title: "IT: Digital Devices Overview",
    subjectId: "it",
    topic: "Unit 1: Digital Devices",
    date: "2026-06-12",
    duration: "47 min",
    driveUrl: "https://drive.google.com/file/d/1ITExampleRecordingId/preview",
    description: "Computer systems, input and output devices, storage, and practical use cases."
  },
  {
    id: "ial-physics-motion",
    title: "Edexcel IAL Physics: Motion",
    subjectId: "edexcel-ial-physics",
    topic: "Motion",
    date: "2026-06-18",
    duration: "45 min",
    driveUrl: "https://drive.google.com/file/d/1RiP73dNNl2Q-1j-_ABbx8hUgy5FDEuOt/view?usp=sharing",
    description: "Unit 1 recording for motion, displacement, velocity, acceleration, and graphs."
  },
  {
    id: "ial-physics-forces-momentum",
    title: "Edexcel IAL Physics: Forces & Momentum",
    subjectId: "edexcel-ial-physics",
    topic: "Forces & Momentum",
    date: "2026-06-18",
    duration: "45 min",
    driveUrl: "https://drive.google.com/file/d/1IALForcesMomentumExampleRecordingId/preview",
    description: "Unit 1 recording for forces, Newton's laws, impulse, and momentum."
  },
  {
    id: "ial-physics-moments",
    title: "Edexcel IAL Physics: Moments",
    subjectId: "edexcel-ial-physics",
    topic: "Moments",
    date: "2026-06-18",
    duration: "40 min",
    driveUrl: "https://drive.google.com/file/d/1IALMomentsExampleRecordingId/preview",
    description: "Unit 1 recording for moments, equilibrium, and centre of gravity."
  },
  {
    id: "ial-physics-work-energy-power",
    title: "Edexcel IAL Physics: Work, Energy & Power",
    subjectId: "edexcel-ial-physics",
    topic: "Work, Energy & Power",
    date: "2026-06-18",
    duration: "48 min",
    driveUrl: "https://drive.google.com/file/d/1IALWorkEnergyPowerExampleRecordingId/preview",
    description: "Unit 1 recording for work done, energy transfers, efficiency, and power."
  },
  {
    id: "ial-physics-density-upthrust-viscous-drag",
    title: "Edexcel IAL Physics: Density, Upthrust & Viscous Drag",
    subjectId: "edexcel-ial-physics",
    topic: "Density, Upthrust & Viscous Drag",
    date: "2026-06-18",
    duration: "44 min",
    driveUrl: "https://drive.google.com/file/d/1IALDensityUpthrustDragExampleRecordingId/preview",
    description: "Unit 1 recording for density, buoyancy, terminal velocity, and drag."
  },
  {
    id: "ial-physics-stretching-materials",
    title: "Edexcel IAL Physics: Stretching Materials",
    subjectId: "edexcel-ial-physics",
    topic: "Stretching Materials",
    date: "2026-06-18",
    duration: "42 min",
    driveUrl: "https://drive.google.com/file/d/1IALStretchingMaterialsExampleRecordingId/preview",
    description: "Unit 1 recording for Hooke's law, stress, strain, and Young modulus."
  }
];

export function buildDriveEmbedUrl(url: string) {
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  const openMatch = url.match(/[?&]id=([^&]+)/);
  const id = fileMatch?.[1] ?? openMatch?.[1];

  if (!id) return url;

  return `https://drive.google.com/file/d/${id}/preview`;
}
