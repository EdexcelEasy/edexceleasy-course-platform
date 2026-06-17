"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  Layers3,
  Link,
  LogOut,
  Circle,
  Search,
  Video
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  buildDriveEmbedUrl,
  lessonsSeed,
  subjectsSeed,
  type CourseSubtopic,
  type CourseTopic,
  type CourseUnit,
  type Lesson,
  type Subject
} from "@/lib/lessons";

const STORAGE_KEY = "edexcel-recorded-lessons";

type StoredData = {
  subjects: Subject[];
  lessons: Lesson[];
};

export default function Home() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>(subjectsSeed);
  const [lessons, setLessons] = useState<Lesson[]>(lessonsSeed);
  const [selectedSubject, setSelectedSubject] = useState(subjectsSeed[0]?.id ?? "all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [openCourseUnit, setOpenCourseUnit] = useState("ial-physics-unit-1");
  const [openTopicId, setOpenTopicId] = useState("");
  const [openSubtopicId, setOpenSubtopicId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState(lessonsSeed[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem("edexcel-auth-role") !== "student") {
      router.replace("/");
      return;
    }

    const loggedEmail = normalizeEmail(window.localStorage.getItem("edexcel-auth-email") ?? "");
    setStudentEmail(loggedEmail);

    void loadStudentAccess(loggedEmail);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const data = JSON.parse(stored) as StoredData;
      if (data.subjects?.length && data.lessons?.length) {
        const normalizedLessons = removeLegacySubjectLessons(data.lessons);
        const migratedLessons = mergeSeedLessons(normalizedLessons);
        setLessons(migratedLessons);
        setSelectedLessonId(migratedLessons[0].id);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [router]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ subjects, lessons }));
  }, [subjects, lessons]);

  async function loadStudentAccess(email: string) {
    setIsLoadingAccess(true);
    const response = await fetch("/api/admin/subjects", { cache: "no-store" });
    const data = (await response.json()) as { subjects: Subject[] };
    const permittedSubjects = data.subjects
      .map((subject) => getPermittedSubject(subject, email))
      .filter((subject): subject is Subject => Boolean(subject));

    setSubjects(permittedSubjects);
    setSelectedSubject(permittedSubjects[0]?.id ?? "all");
    setSelectedTopic("all");
    setIsLoadingAccess(false);
  }

  const subjectIds = useMemo(() => new Set(subjects.map((subject) => subject.id)), [subjects]);
  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => subjectIds.has(lesson.subjectId)),
    [lessons, subjectIds]
  );

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleLessons.filter((lesson) => {
      const subjectMatch = selectedSubject === "all" || lesson.subjectId === selectedSubject;
      const topicMatch = selectedTopic === "all" || lesson.topic === selectedTopic;
      const textMatch =
        !normalizedQuery ||
        [lesson.title, lesson.topic, lesson.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return subjectMatch && topicMatch && textMatch;
    });
  }, [query, selectedSubject, selectedTopic, visibleLessons]);

  const selectedLesson = useMemo(() => {
    return visibleLessons.find((lesson) => lesson.id === selectedLessonId) ?? filteredLessons[0] ?? visibleLessons[0];
  }, [filteredLessons, selectedLessonId, visibleLessons]);

  const selectedSubjectData = subjects.find((subject) => subject.id === selectedSubject);
  const topicCount = subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
  const totalHours = Math.round(
    visibleLessons.reduce((sum, lesson) => sum + parseDurationToMinutes(lesson.duration), 0) / 60
  );

  function handleLogout() {
    window.localStorage.removeItem("edexcel-auth-role");
    window.localStorage.removeItem("edexcel-auth-email");
    router.push("/");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Subject navigation">
        <div className="brand">
          <span className="brand-mark">
            <GraduationCap size={24} aria-hidden="true" />
          </span>
          <div>
            <p>EdexcelEasy</p>
            <strong>Recorded Lessons</strong>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout} type="button">
          <LogOut size={17} aria-hidden="true" />
          Logout
        </button>

        <div className="student-account">
          <span>Signed in as</span>
          <strong>{studentEmail || "Student"}</strong>
        </div>

        <button
          className={selectedSubject === "all" ? "subject-button active" : "subject-button"}
          onClick={() => {
            setSelectedSubject("all");
            setSelectedTopic("all");
          }}
        >
          <BookOpen size={18} aria-hidden="true" />
          <span>All Subjects</span>
          <strong>{visibleLessons.length}</strong>
        </button>

        <div className="subject-list">
          {subjects.map((subject) => {
            const count = visibleLessons.filter((lesson) => lesson.subjectId === subject.id).length;
            const isActiveSubject = selectedSubject === subject.id;
            return (
              <div className="classroom-group" key={subject.id}>
                <button
                  className={isActiveSubject && selectedTopic === "all" ? "subject-button active" : "subject-button"}
                  onClick={() => {
                    setSelectedSubject(subject.id);
                    setSelectedTopic("all");
                  }}
                >
                  <span className="subject-dot" style={{ background: subject.color }} />
                  <span>{subject.name}</span>
                  <strong>{count}</strong>
                </button>
              </div>
            );
          })}
        </div>

      </aside>

      <section className="lesson-column">
        <header className="topbar">
          <div>
            <p className="eyebrow">Learning library</p>
            <h1>Google Drive recorded course platform</h1>
          </div>
          <div className="topbar-tools">
            <div className="search-row top-search">
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search topics or recordings"
              />
            </div>
            <div className="stats">
              <span>
                <Video size={17} aria-hidden="true" />
                {visibleLessons.length} lessons
              </span>
              <span>
                <Clock3 size={17} aria-hidden="true" />
                {totalHours}+ hours
              </span>
              <span>
                <Layers3 size={17} aria-hidden="true" />
                {topicCount} topics
              </span>
            </div>
          </div>
        </header>

        <div className="classroom-bar">
          <span>{isLoadingAccess ? "Checking access" : selectedSubjectData?.name ?? "No subject access"}</span>
          <strong>{selectedTopic === "all" ? "All topics" : selectedTopic}</strong>
        </div>

        {selectedSubjectData?.units && (
          <div className="course-outline" aria-label={`${selectedSubjectData.name} course outline`}>
            {selectedSubjectData.units.map((unit) => {
              const isOpen = openCourseUnit === unit.id;
              const unitTopics = getFilteredUnitTopics(unit, query);

              return (
                <article className={isOpen ? "unit-card open" : "unit-card"} key={unit.id}>
                  <button
                    className="unit-summary"
                    onClick={() => setOpenCourseUnit((current) => (current === unit.id ? "" : unit.id))}
                  >
                    <span>
                      <strong>{unit.title}</strong>
                      <small>
                        {unit.topicCount} Topics · {unit.revisionNoteCount} Revision Notes
                      </small>
                    </span>
                    <span className={isOpen ? "unit-toggle active" : "unit-toggle"}>
                      {isOpen ? <ChevronUp size={19} aria-hidden="true" /> : <ChevronDown size={19} aria-hidden="true" />}
                    </span>
                  </button>

                  {isOpen && unitTopics.length > 0 && (
                    <div className="unit-topic-list">
                      {unitTopics.map((topic) => {
                        const lesson = visibleLessons.find(
                          (item) => item.subjectId === selectedSubjectData.id && item.topic === topic.title
                        );
                        const subtopics = getTopicSubtopics(topic, lesson);
                        const isExpanded = openTopicId === topic.id;

                        return (
                          <div className="unit-topic-item" key={topic.id}>
                            <button
                              className={isExpanded ? "unit-topic-row active" : "unit-topic-row"}
                              onClick={() => {
                                setQuery("");
                                if (isExpanded) {
                                  setOpenTopicId("");
                                  setOpenSubtopicId("");
                                  return;
                                }
                                setSelectedTopic(topic.title);
                                setOpenTopicId(topic.id);
                                setOpenSubtopicId("");
                              }}
                            >
                              <Circle size={24} aria-hidden="true" />
                              <span>{topic.title}</span>
                              <span className={isExpanded ? "unit-topic-chevron active" : "unit-topic-chevron"}>
                                {isExpanded ? (
                                  <ChevronUp size={18} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={18} aria-hidden="true" />
                                )}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="unit-subtopic-list">
                                {subtopics.map((subtopic) => {
                                  const isSubtopicOpen = openSubtopicId === subtopic.id;

                                  return (
                                    <div className="unit-subtopic-item" key={subtopic.id}>
                                      <button
                                        className={isSubtopicOpen ? "unit-subtopic-row active" : "unit-subtopic-row"}
                                        onClick={() => {
                                          setOpenSubtopicId(isSubtopicOpen ? "" : subtopic.id);
                                          if (lesson) setSelectedLessonId(lesson.id);
                                        }}
                                      >
                                        <span>{subtopic.title}</span>
                                        {isSubtopicOpen ? (
                                          <ChevronUp size={17} aria-hidden="true" />
                                        ) : (
                                          <ChevronDown size={17} aria-hidden="true" />
                                        )}
                                      </button>

                                      {isSubtopicOpen && (
                                        <section
                                          className="unit-topic-player"
                                          aria-label={`${subtopic.title} recording`}
                                        >
                                          <iframe
                                            src={buildDriveEmbedUrl(subtopic.driveUrl)}
                                            allow="autoplay; encrypted-media; fullscreen"
                                            allowFullScreen
                                            title={subtopic.title}
                                          />
                                          <div className="inline-player-actions">
                                            <a href={subtopic.driveUrl} target="_blank" rel="noreferrer">
                                              <Link size={16} aria-hidden="true" />
                                              Open in Google Drive
                                            </a>
                                          </div>
                                        </section>
                                      )}
                                    </div>
                                  );
                                })}

                                {!subtopics.length && <div className="unit-subtopic-empty">No recordings yet.</div>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {selectedSubjectData?.units && query.trim() && !hasAnyFilteredTopic(selectedSubjectData.units, query) && (
          <div className="empty-state">
            <Search size={28} aria-hidden="true" />
            <strong>No matching topics</strong>
            <span>Try another search term.</span>
          </div>
        )}

        {!isLoadingAccess && !subjects.length && (
          <div className="empty-state">
            <Video size={28} aria-hidden="true" />
            <strong>No subject access</strong>
            <span>Ask the admin to add your Gmail to a subject.</span>
          </div>
        )}
      </section>

    </main>
  );
}

function getPermittedSubject(subject: Subject, email: string): Subject | null {
  const hasSubjectAccess = subject.allowedEmails.includes(email);
  const permittedUnits = (subject.units ?? []).filter((unit) => (unit.allowedEmails ?? []).includes(email));

  if (subject.units?.length) {
    if (!hasSubjectAccess && !permittedUnits.length) return null;

    const permittedTopics = permittedUnits.flatMap((unit) => unit.topics);

    return {
      ...subject,
      units: permittedUnits,
      topics: Array.from(new Set(permittedTopics))
    };
  }

  if (!hasSubjectAccess) return null;

  return {
    ...subject
  };
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

function hydrateSubjectTopics(subjects: Subject[], lessons: Lesson[]) {
  return subjects.map((subject) => {
    const seedSubject = subjectsSeed.find((item) => item.id === subject.id);
    const savedTopics = subject.topics ?? [];
    const seedTopics = seedSubject?.topics ?? [];
    const savedEmails = subject.allowedEmails ?? [];
    const seedEmails = seedSubject?.allowedEmails ?? [];
    const lessonTopics = lessons
      .filter((lesson) => lesson.subjectId === subject.id)
      .map((lesson) => lesson.topic)
      .filter(Boolean);

    return {
      ...subject,
      name: seedSubject?.name ?? subject.name,
      allowedEmails: Array.from(new Set([...seedEmails, ...savedEmails].map(normalizeEmail).filter(Boolean))),
      units: seedSubject?.units ?? subject.units,
      topics: Array.from(new Set([...seedTopics, ...savedTopics, ...lessonTopics]))
    };
  });
}

function mergeSeedLessons(savedLessons: Lesson[]) {
  const seedById = new Map(lessonsSeed.map((lesson) => [lesson.id, lesson]));
  const updatedSavedLessons = savedLessons.map((lesson) => seedById.get(lesson.id) ?? lesson);
  const savedIds = new Set(updatedSavedLessons.map((lesson) => lesson.id));
  const missingSeedLessons = lessonsSeed.filter((lesson) => !savedIds.has(lesson.id));

  return [...updatedSavedLessons, ...missingSeedLessons];
}

function getUnitTopics(unit: CourseUnit): CourseTopic[] {
  if (unit.topicItems?.length) return unit.topicItems;

  return unit.topics.map((topic) => ({
    id: `${unit.id}-${slugify(topic)}`,
    title: topic,
    subtopics: []
  }));
}

function getFilteredUnitTopics(unit: CourseUnit, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const topics = getUnitTopics(unit);

  if (!normalizedQuery) return topics;

  return topics.filter((topic) => {
    const subtopicText = topic.subtopics.map((subtopic) => subtopic.title).join(" ");
    return `${topic.title} ${subtopicText}`.toLowerCase().includes(normalizedQuery);
  });
}

function hasAnyFilteredTopic(units: CourseUnit[], query: string) {
  return units.some((unit) => getFilteredUnitTopics(unit, query).length > 0);
}

function getTopicSubtopics(topic: CourseTopic, lesson?: Lesson): CourseSubtopic[] {
  if (topic.subtopics.length) return topic.subtopics;
  if (!lesson) return [];

  return [
    {
      id: `${topic.id}-recording`,
      title: lesson.title,
      driveUrl: lesson.driveUrl
    }
  ];
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function replaceLegacySubjectWithIt(savedSubjects: Subject[]) {
  const withoutLegacySubjects = savedSubjects.filter((subject) => subject.id !== "business");
  const savedIds = new Set(withoutLegacySubjects.map((subject) => subject.id));
  const missingSeedSubjects = subjectsSeed.filter((subject) => !savedIds.has(subject.id));

  return [...withoutLegacySubjects, ...missingSeedSubjects];
}

function removeLegacySubjectLessons(savedLessons: Lesson[]) {
  return savedLessons.filter((lesson) => lesson.subjectId !== "business");
}

function parseDurationToMinutes(duration: string) {
  const match = duration.match(/\d+/);
  return match ? Number(match[0]) : 0;
}
