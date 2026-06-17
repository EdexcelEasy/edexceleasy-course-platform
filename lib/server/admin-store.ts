import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { subjectsSeed, type CourseSubtopic, type CourseTopic, type CourseUnit, type Subject } from "@/lib/lessons";

type AdminStore = {
  subjects: Subject[];
};

const storePath = path.join(process.cwd(), "data", "admin-access.json");

export async function getAdminSubjects() {
  const store = await readStore();
  const storedIds = new Set(store.subjects.map((subject) => subject.id));
  const missingSeedSubjects = subjectsSeed.filter((subject) => !storedIds.has(subject.id));

  return [...store.subjects, ...missingSeedSubjects];
}

export async function addSubject(name: string) {
  const store = await readStore();
  const trimmedName = name.trim();
  const id = slugify(trimmedName);

  if (!trimmedName || store.subjects.some((subject) => subject.id === id)) {
    return getAdminSubjects();
  }

  store.subjects.push({
    id,
    name: trimmedName,
    color: pickSubjectColor(store.subjects.length),
    topics: [],
    allowedEmails: [],
    units: []
  });

  await writeStore(store);
  return getAdminSubjects();
}

export async function addSubjectAccess(subjectId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);

  if (!subject) {
    store.subjects.push({
      id: subjectId,
      name: subjectId,
      color: pickSubjectColor(store.subjects.length),
      topics: [],
      allowedEmails: normalizedEmail ? [normalizedEmail] : [],
      units: []
    });
  } else if (normalizedEmail && !subject.allowedEmails.includes(normalizedEmail)) {
    subject.allowedEmails.push(normalizedEmail);
  }

  await writeStore(store);
  return getAdminSubjects();
}

export async function removeSubjectAccess(subjectId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);

  if (subject) {
    subject.allowedEmails = subject.allowedEmails.filter((item) => item !== normalizedEmail);
    await writeStore(store);
  }

  return getAdminSubjects();
}

export async function addUnitAccess(subjectId: string, unitId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);

  if (!subject || !normalizedEmail) return getAdminSubjects();

  subject.units = (subject.units ?? []).map((unit) => {
    if (unit.id !== unitId || unit.allowedEmails?.includes(normalizedEmail)) return unit;
    return {
      ...unit,
      allowedEmails: [...(unit.allowedEmails ?? []), normalizedEmail]
    };
  });

  await writeStore(store);
  return getAdminSubjects();
}

export async function removeUnitAccess(subjectId: string, unitId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);

  if (!subject) return getAdminSubjects();

  subject.units = (subject.units ?? []).map((unit) => {
    if (unit.id !== unitId) return unit;
    return {
      ...unit,
      allowedEmails: (unit.allowedEmails ?? []).filter((item) => item !== normalizedEmail)
    };
  });

  await writeStore(store);
  return getAdminSubjects();
}

export async function addSubjectUnit(subjectId: string, title: string) {
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);
  const trimmedTitle = title.trim();

  if (!subject || !trimmedTitle) return getAdminSubjects();

  const units = subject.units ?? [];
  const unit: CourseUnit = {
    id: `${subjectId}-${slugify(trimmedTitle)}-${Date.now()}`,
    title: trimmedTitle,
    topicCount: 0,
    revisionNoteCount: 0,
    topics: [],
    allowedEmails: [],
    topicItems: []
  };

  subject.units = [...units, unit];
  await writeStore(store);
  return getAdminSubjects();
}

export async function addUnitTopic(subjectId: string, unitId: string, topic: string) {
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);
  const trimmedTopic = topic.trim();

  if (!subject || !trimmedTopic) return getAdminSubjects();

  subject.units = (subject.units ?? []).map((unit) => {
    if (unit.id !== unitId || unit.topics.includes(trimmedTopic)) return unit;
    const topics = [...unit.topics, trimmedTopic];
    const topicItems = [
      ...getUnitTopicItems(unit),
      {
        id: `${unitId}-${slugify(trimmedTopic)}-${Date.now()}`,
        title: trimmedTopic,
        subtopics: []
      }
    ];

    return {
      ...unit,
      topics,
      topicItems,
      topicCount: topics.length
    };
  });

  if (!subject.topics.includes(trimmedTopic)) {
    subject.topics.push(trimmedTopic);
  }

  await writeStore(store);
  return getAdminSubjects();
}

export async function updateUnitTopic(subjectId: string, unitId: string, topicId: string, title: string) {
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);
  const trimmedTitle = title.trim();

  if (!subject || !trimmedTitle) return getAdminSubjects();

  let previousTitle = "";

  subject.units = (subject.units ?? []).map((unit) => {
    if (unit.id !== unitId) return unit;

    const topicItems = getUnitTopicItems(unit).map((topic) => {
      if (topic.id !== topicId) return topic;
      previousTitle = topic.title;
      return {
        ...topic,
        title: trimmedTitle
      };
    });

    return {
      ...unit,
      topicItems,
      topics: topicItems.map((topic) => topic.title),
      topicCount: topicItems.length
    };
  });

  if (previousTitle) {
    subject.topics = subject.topics.map((topic) => (topic === previousTitle ? trimmedTitle : topic));
  }

  await writeStore(store);
  return getAdminSubjects();
}

export async function addTopicSubtopic(
  subjectId: string,
  unitId: string,
  topicId: string,
  title: string,
  driveUrl: string
) {
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);
  const trimmedTitle = title.trim();
  const trimmedDriveUrl = driveUrl.trim();

  if (!subject || !trimmedTitle || !trimmedDriveUrl) return getAdminSubjects();

  subject.units = (subject.units ?? []).map((unit) => {
    if (unit.id !== unitId) return unit;

    const topicItems = getUnitTopicItems(unit).map((topic) => {
      if (topic.id !== topicId) return topic;

      const subtopic: CourseSubtopic = {
        id: `${topicId}-${slugify(trimmedTitle)}-${Date.now()}`,
        title: trimmedTitle,
        driveUrl: trimmedDriveUrl
      };

      return {
        ...topic,
        subtopics: [...topic.subtopics, subtopic]
      };
    });

    return { ...unit, topicItems };
  });

  await writeStore(store);
  return getAdminSubjects();
}

export async function updateTopicSubtopic(
  subjectId: string,
  unitId: string,
  topicId: string,
  subtopicId: string,
  title: string,
  driveUrl: string
) {
  const store = await readStore();
  const subject = store.subjects.find((item) => item.id === subjectId);
  const trimmedTitle = title.trim();
  const trimmedDriveUrl = driveUrl.trim();

  if (!subject || !trimmedTitle || !trimmedDriveUrl) return getAdminSubjects();

  subject.units = (subject.units ?? []).map((unit) => {
    if (unit.id !== unitId) return unit;

    const topicItems = getUnitTopicItems(unit).map((topic) => {
      if (topic.id !== topicId) return topic;

      return {
        ...topic,
        subtopics: topic.subtopics.map((subtopic) => {
          if (subtopic.id !== subtopicId) return subtopic;
          return {
            ...subtopic,
            title: trimmedTitle,
            driveUrl: trimmedDriveUrl
          };
        })
      };
    });

    return { ...unit, topicItems };
  });

  await writeStore(store);
  return getAdminSubjects();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickSubjectColor(index: number) {
  const colors = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#d97706", "#0891b2"];
  return colors[index % colors.length];
}

async function readStore(): Promise<AdminStore> {
  try {
    const rawStore = await readFile(storePath, "utf8");
    const parsedStore = JSON.parse(rawStore) as Partial<AdminStore>;
    const storedSubjects = parsedStore.subjects ?? [];

    return {
      subjects: hydrateStoredSubjects(storedSubjects)
    };
  } catch {
    const initialStore = {
      subjects: subjectsSeed
    };
    await writeStore(initialStore);
    return initialStore;
  }
}

function hydrateStoredSubjects(storedSubjects: Partial<Subject>[]): Subject[] {
  return storedSubjects.map((storedSubject, index) => {
    const seedSubject = subjectsSeed.find((subject) => subject.id === storedSubject.id);

    return {
      id: storedSubject.id ?? seedSubject?.id ?? `subject-${index}`,
      name: storedSubject.name ?? seedSubject?.name ?? "Untitled subject",
      color: storedSubject.color ?? seedSubject?.color ?? pickSubjectColor(index),
      topics: storedSubject.topics ?? seedSubject?.topics ?? [],
      allowedEmails: storedSubject.allowedEmails ?? seedSubject?.allowedEmails ?? [],
      units: (storedSubject.units ?? seedSubject?.units ?? []).map(hydrateUnitTopics)
    };
  });
}

function hydrateUnitTopics(unit: CourseUnit): CourseUnit {
  const topicItems = getUnitTopicItems(unit);

  return {
    ...unit,
    allowedEmails: unit.allowedEmails ?? [],
    topicItems,
    topicCount: topicItems.length || unit.topicCount,
    topics: topicItems.map((topic) => topic.title)
  };
}

function getUnitTopicItems(unit: CourseUnit): CourseTopic[] {
  if (unit.topicItems?.length) return unit.topicItems;

  return unit.topics.map((topic) => ({
    id: `${unit.id}-${slugify(topic)}`,
    title: topic,
    subtopics: []
  }));
}

async function writeStore(store: AdminStore) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2));
}
