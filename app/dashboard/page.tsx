"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Layers3,
  LogOut,
  Maximize2,
  Minimize2,
  Circle,
  Search,
  Video,
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
  type PdfResource,
  type Subject,
} from "@/lib/lessons";

type DashboardCategory = "subjects" | "pdf";

export default function Home() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>(subjectsSeed);
  const [pdfs, setPdfs] = useState<PdfResource[]>([]);
  const lessons = lessonsSeed;
  const [selectedCategory, setSelectedCategory] =
    useState<DashboardCategory>("subjects");
  const [selectedSubject, setSelectedSubject] = useState(
    subjectsSeed[0]?.id ?? "all",
  );
  const [selectedPdfSubjectId, setSelectedPdfSubjectId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [openCourseUnit, setOpenCourseUnit] = useState("ial-physics-unit-1");
  const [openTopicId, setOpenTopicId] = useState("");
  const [openSubtopicId, setOpenSubtopicId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState(
    lessonsSeed[0]?.id ?? "",
  );
  const [selectedPdfId, setSelectedPdfId] = useState("");
  const [query, setQuery] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [fullscreenElementId, setFullscreenElementId] = useState("");

  useEffect(() => {
    if (window.localStorage.getItem("edexcel-auth-role") !== "student") {
      router.replace("/");
      return;
    }

    const loggedEmail = normalizeEmail(
      window.localStorage.getItem("edexcel-auth-email") ?? "",
    );
    setStudentEmail(loggedEmail);
    setStudentName(window.localStorage.getItem("edexcel-auth-name") ?? "");

    void loadStudentAccess(loggedEmail);
  }, [router]);

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreenElementId(document.fullscreenElement?.id ?? "");
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function loadStudentAccess(email: string) {
    setIsLoadingAccess(true);
    const [subjectsResponse, pdfsResponse] = await Promise.all([
      fetch("/api/admin/subjects", { cache: "no-store" }),
      fetch("/api/admin/pdfs", { cache: "no-store" }),
    ]);
    const data = (await subjectsResponse.json()) as { subjects: Subject[] };
    const pdfData = (await pdfsResponse.json()) as { pdfs: PdfResource[] };
    const permittedSubjects = data.subjects
      .map((subject) => getPermittedSubject(subject, email))
      .filter((subject): subject is Subject => Boolean(subject));
    const permittedPdfs = (pdfData.pdfs ?? []).filter((pdf) =>
      (pdf.allowedEmails ?? []).includes(email),
    );

    setSubjects(permittedSubjects);
    setPdfs(permittedPdfs);
    setSelectedPdfId(permittedPdfs[0]?.id ?? "");
    setSelectedPdfSubjectId(permittedPdfs[0]?.pdfSubjectId ?? "");
    setSelectedCategory("subjects");
    setSelectedSubject(permittedSubjects[0]?.id ?? "all");
    setSelectedTopic("all");
    setIsLoadingAccess(false);
  }

  const subjectIds = useMemo(
    () => new Set(subjects.map((subject) => subject.id)),
    [subjects],
  );
  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => subjectIds.has(lesson.subjectId)),
    [lessons, subjectIds],
  );

  const filteredLessons = useMemo(() => {
    if (selectedCategory === "pdf") return [];

    const normalizedQuery = query.trim().toLowerCase();

    return visibleLessons.filter((lesson) => {
      const subjectMatch =
        selectedSubject === "all" || lesson.subjectId === selectedSubject;
      const topicMatch =
        selectedTopic === "all" || lesson.topic === selectedTopic;
      const textMatch =
        !normalizedQuery ||
        [lesson.title, lesson.topic, lesson.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return subjectMatch && topicMatch && textMatch;
    });
  }, [query, selectedCategory, selectedSubject, selectedTopic, visibleLessons]);

  const selectedLesson = useMemo(() => {
    return (
      visibleLessons.find((lesson) => lesson.id === selectedLessonId) ??
      filteredLessons[0] ??
      visibleLessons[0]
    );
  }, [filteredLessons, selectedLessonId, visibleLessons]);

  const filteredPdfs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const subjectFilteredPdfs = selectedPdfSubjectId
      ? pdfs.filter((pdf) => (pdf.pdfSubjectId ?? "") === selectedPdfSubjectId)
      : pdfs;

    if (!normalizedQuery) return subjectFilteredPdfs;

    return subjectFilteredPdfs.filter((pdf) =>
      [pdf.title, pdf.pdfSubjectName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [pdfs, query, selectedPdfSubjectId]);

  const selectedPdf = filteredPdfs.find((pdf) => pdf.id === selectedPdfId);
  const pdfGroups = useMemo(
    () => groupPdfsBySubject(filteredPdfs),
    [filteredPdfs],
  );
  const pdfSubjectOptions = useMemo(() => getPdfSubjectOptions(pdfs), [pdfs]);
  const selectedPdfSubject = pdfSubjectOptions.find(
    (subject) => subject.id === selectedPdfSubjectId,
  );

  const selectedSubjectData =
    selectedCategory === "subjects"
      ? subjects.find((subject) => subject.id === selectedSubject)
      : undefined;
  const topicCount = subjects.reduce(
    (sum, subject) => sum + subject.topics.length,
    0,
  );
  const totalHours = Math.round(
    visibleLessons.reduce(
      (sum, lesson) => sum + parseDurationToMinutes(lesson.duration),
      0,
    ) / 60,
  );

  function handleLogout() {
    window.localStorage.removeItem("edexcel-auth-role");
    window.localStorage.removeItem("edexcel-auth-email");
    window.localStorage.removeItem("edexcel-auth-name");
    router.push("/");
  }

  function selectCategory(nextCategory: DashboardCategory) {
    setSelectedCategory(nextCategory);
    setSelectedSubject(
      nextCategory === "subjects" ? (subjects[0]?.id ?? "all") : "all",
    );
    setSelectedTopic("all");
    setOpenCourseUnit(nextCategory === "subjects" ? "ial-physics-unit-1" : "");
    setOpenTopicId("");
    setOpenSubtopicId("");
    if (nextCategory === "pdf") {
      setSelectedPdfSubjectId(
        (current) => current || pdfs[0]?.pdfSubjectId || "",
      );
      setSelectedPdfId("");
    }
    setIsCategoryMenuOpen(false);
  }

  function toggleFullscreen(elementId: string) {
    if (document.fullscreenElement?.id === elementId) {
      void document.exitFullscreen();
      return;
    }

    const element = document.getElementById(elementId);
    void element?.requestFullscreen?.();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Subject navigation">
        <div className="brand">
          <span className="brand-mark">
            <img className="brand-logo" src="/logo.png" alt="" />
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
          <strong>{studentName || studentEmail || "Student"}</strong>
          {studentName && studentEmail && <small>{studentEmail}</small>}
        </div>

        <div className="category-dropdown">
          <button
            className="category-trigger"
            type="button"
            aria-expanded={isCategoryMenuOpen}
            aria-controls="dashboardCategoryMenu"
            onClick={() => setIsCategoryMenuOpen((current) => !current)}
          >
            {selectedCategory === "subjects" ? (
              <BookOpen size={18} aria-hidden="true" />
            ) : (
              <FileText size={18} aria-hidden="true" />
            )}
            <span>
              {selectedCategory === "subjects" ? "All Subject" : "PDF"}
            </span>
            <ChevronDown size={17} aria-hidden="true" />
          </button>

          {isCategoryMenuOpen && (
            <div
              className="category-menu"
              id="dashboardCategoryMenu"
              role="menu"
            >
              <button
                className={selectedCategory === "subjects" ? "active" : ""}
                type="button"
                role="menuitem"
                onClick={() => selectCategory("subjects")}
              >
                <BookOpen size={17} aria-hidden="true" />
                <span>All Subject</span>
              </button>
              <button
                className={selectedCategory === "pdf" ? "active" : ""}
                type="button"
                role="menuitem"
                onClick={() => selectCategory("pdf")}
              >
                <FileText size={17} aria-hidden="true" />
                <span>PDF</span>
              </button>
            </div>
          )}
        </div>

        {selectedCategory === "subjects" && (
          <div className="subject-list">
            {subjects.map((subject) => {
              const count = visibleLessons.filter(
                (lesson) => lesson.subjectId === subject.id,
              ).length;
              const isActiveSubject = selectedSubject === subject.id;
              return (
                <div className="classroom-group" key={subject.id}>
                  <button
                    className={
                      isActiveSubject && selectedTopic === "all"
                        ? "subject-button active"
                        : "subject-button"
                    }
                    onClick={() => {
                      setSelectedSubject(subject.id);
                      setSelectedTopic("all");
                    }}
                  >
                    <span
                      className="subject-dot"
                      style={{ background: subject.color }}
                    />
                    <span>{subject.name}</span>
                    <strong>{count}</strong>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selectedCategory === "pdf" && (
          <div className="subject-list">
            {pdfSubjectOptions.map((subject) => {
              const isActiveSubject = selectedPdfSubjectId === subject.id;

              return (
                <div className="classroom-group" key={subject.id}>
                  <button
                    className={
                      isActiveSubject
                        ? "subject-button active"
                        : "subject-button"
                    }
                    onClick={() => {
                      setSelectedPdfSubjectId(subject.id);
                      setSelectedPdfId("");
                    }}
                  >
                    <span className="subject-dot pdf-dot" />
                    <span>{subject.name}</span>
                    <strong>{subject.count}</strong>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <section className="lesson-column">
        <header className="topbar">
          <div>
            <p className="eyebrow">Edexcel Easy Recorded Course</p>
            <h1>Welcome {studentName || studentEmail || "Student"}</h1>
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
            {/* <div className="stats">
              <span>
                <Video size={17} aria-hidden="true" />
                {selectedCategory === "pdf"
                  ? `${pdfs.length} PDFs`
                  : `${visibleLessons.length} lessons`}
              </span>
              <span>
                <Clock3 size={17} aria-hidden="true" />
                {selectedCategory === "pdf" ? 0 : totalHours}+ hours
              </span>
              <span>
                <Layers3 size={17} aria-hidden="true" />
                {selectedCategory === "pdf"
                  ? `${pdfs.length} resources`
                  : `${topicCount} topics`}
              </span>
            </div> */}
          </div>
        </header>

        <div className="classroom-bar">
          <span>
            {isLoadingAccess
              ? "Checking access"
              : selectedCategory === "pdf"
                ? (selectedPdfSubject?.name ?? "PDF")
                : (selectedSubjectData?.name ?? "No subject access")}
          </span>
          <strong>
            {selectedCategory === "pdf"
              ? "PDF resources"
              : selectedTopic === "all"
                ? "All topics"
                : selectedTopic}
          </strong>
        </div>

        {selectedCategory === "pdf" && pdfs.length > 0 && (
          <div className="pdf-library">
            <div className="pdf-list" aria-label="PDF resources">
              {pdfGroups.map((group) => (
                <div className="pdf-subject-group" key={group.subjectName}>
                  <div className="pdf-subject-heading">
                    <FileText size={17} aria-hidden="true" />
                    <span>{group.subjectName}</span>
                    <strong>{group.pdfs.length}</strong>
                  </div>

                  {group.pdfs.map((pdf, pdfIndex) => {
                    const isPdfOpen = selectedPdf?.id === pdf.id;

                    return (
                      <div className="pdf-item" key={pdf.id}>
                        <button
                          className={isPdfOpen ? "pdf-row active" : "pdf-row"}
                          type="button"
                          onClick={() =>
                            setSelectedPdfId(isPdfOpen ? "" : pdf.id)
                          }
                        >
                          <span className="unit-subtopic-number">
                            {pdfIndex + 1}
                          </span>
                          <span>{pdf.title}</span>
                          {isPdfOpen ? (
                            <ChevronUp size={17} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={17} aria-hidden="true" />
                          )}
                        </button>

                        {isPdfOpen && (
                          <section
                            className="pdf-viewer"
                            id={`pdf-viewer-${pdf.id}`}
                            aria-label={`${pdf.title} PDF`}
                          >
                            <button
                              className="viewer-fullscreen-button"
                              type="button"
                              onClick={() =>
                                toggleFullscreen(`pdf-viewer-${pdf.id}`)
                              }
                              title={
                                fullscreenElementId === `pdf-viewer-${pdf.id}`
                                  ? "Minimize"
                                  : "Full screen"
                              }
                              aria-label={
                                fullscreenElementId === `pdf-viewer-${pdf.id}`
                                  ? "Minimize PDF"
                                  : "Open PDF in full screen"
                              }
                            >
                              {fullscreenElementId ===
                              `pdf-viewer-${pdf.id}` ? (
                                <Minimize2 size={16} aria-hidden="true" />
                              ) : (
                                <Maximize2 size={16} aria-hidden="true" />
                              )}
                              <span className="viewer-fullscreen-label">
                                {fullscreenElementId === `pdf-viewer-${pdf.id}`
                                  ? "Minimize"
                                  : "Full screen"}
                              </span>
                            </button>
                            <iframe
                              src={buildDriveEmbedUrl(pdf.driveUrl)}
                              title={pdf.title}
                              allowFullScreen
                            />
                          </section>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {!filteredPdfs.length && (
              <div className="empty-state">
                <Search size={28} aria-hidden="true" />
                <strong>No matching PDFs</strong>
                <span>Try another search term.</span>
              </div>
            )}
          </div>
        )}

        {selectedCategory === "pdf" && !pdfs.length && (
          <div className="empty-state">
            <FileText size={28} aria-hidden="true" />
            <strong>No PDFs yet</strong>
            <span>PDF resources will appear here.</span>
          </div>
        )}

        {selectedSubjectData?.units && (
          <div
            className="course-outline"
            aria-label={`${selectedSubjectData.name} course outline`}
          >
            {selectedSubjectData.units.map((unit) => {
              const isOpen = openCourseUnit === unit.id;
              const unitTopics = getFilteredUnitTopics(unit, query);

              return (
                <article
                  className={isOpen ? "unit-card open" : "unit-card"}
                  key={unit.id}
                >
                  <button
                    className="unit-summary"
                    onClick={() =>
                      setOpenCourseUnit((current) =>
                        current === unit.id ? "" : unit.id,
                      )
                    }
                  >
                    <span>
                      <strong>{unit.title}</strong>
                      <small>{unit.topicCount} Topics</small>
                    </span>
                    <span
                      className={isOpen ? "unit-toggle active" : "unit-toggle"}
                    >
                      {isOpen ? (
                        <ChevronUp size={19} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={19} aria-hidden="true" />
                      )}
                    </span>
                  </button>

                  {isOpen && unitTopics.length > 0 && (
                    <div className="unit-topic-list">
                      {unitTopics.map((topic) => {
                        const lesson = visibleLessons.find(
                          (item) =>
                            item.subjectId === selectedSubjectData.id &&
                            item.topic === topic.title,
                        );
                        const subtopics = getTopicSubtopics(topic, lesson);
                        const isExpanded = openTopicId === topic.id;

                        return (
                          <div className="unit-topic-item" key={topic.id}>
                            <button
                              className={
                                isExpanded
                                  ? "unit-topic-row active"
                                  : "unit-topic-row"
                              }
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
                              <span
                                className={
                                  isExpanded
                                    ? "unit-topic-chevron active"
                                    : "unit-topic-chevron"
                                }
                              >
                                {isExpanded ? (
                                  <ChevronUp size={18} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={18} aria-hidden="true" />
                                )}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="unit-subtopic-list">
                                {subtopics.map((subtopic, subtopicIndex) => {
                                  const isSubtopicOpen =
                                    openSubtopicId === subtopic.id;

                                  return (
                                    <div
                                      className="unit-subtopic-item"
                                      key={subtopic.id}
                                    >
                                      <button
                                        className={
                                          isSubtopicOpen
                                            ? "unit-subtopic-row active"
                                            : "unit-subtopic-row"
                                        }
                                        onClick={() => {
                                          setOpenSubtopicId(
                                            isSubtopicOpen ? "" : subtopic.id,
                                          );
                                          if (lesson)
                                            setSelectedLessonId(lesson.id);
                                        }}
                                      >
                                        <span className="unit-subtopic-label">
                                          <span className="unit-subtopic-number">
                                            {subtopicIndex + 1}
                                          </span>
                                          <span>{subtopic.title}</span>
                                        </span>
                                        {isSubtopicOpen ? (
                                          <ChevronUp
                                            size={17}
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <ChevronDown
                                            size={17}
                                            aria-hidden="true"
                                          />
                                        )}
                                      </button>

                                      {isSubtopicOpen && (
                                        <section
                                          className="unit-topic-player"
                                          id={`video-viewer-${subtopic.id}`}
                                          aria-label={`${subtopic.title} recording`}
                                        >
                                          <button
                                            className="viewer-fullscreen-button"
                                            type="button"
                                            onClick={() =>
                                              toggleFullscreen(
                                                `video-viewer-${subtopic.id}`,
                                              )
                                            }
                                            title={
                                              fullscreenElementId ===
                                              `video-viewer-${subtopic.id}`
                                                ? "Minimize"
                                                : "Full screen"
                                            }
                                            aria-label={
                                              fullscreenElementId ===
                                              `video-viewer-${subtopic.id}`
                                                ? "Minimize video"
                                                : "Open video in full screen"
                                            }
                                          >
                                            {fullscreenElementId ===
                                            `video-viewer-${subtopic.id}` ? (
                                              <Minimize2
                                                size={16}
                                                aria-hidden="true"
                                              />
                                            ) : (
                                              <Maximize2
                                                size={16}
                                                aria-hidden="true"
                                              />
                                            )}
                                            <span className="viewer-fullscreen-label">
                                              {fullscreenElementId ===
                                              `video-viewer-${subtopic.id}`
                                                ? "Minimize"
                                                : "Full screen"}
                                            </span>
                                          </button>
                                          <iframe
                                            src={buildDriveEmbedUrl(
                                              subtopic.driveUrl,
                                            )}
                                            allow="autoplay; encrypted-media; fullscreen"
                                            allowFullScreen
                                            title={subtopic.title}
                                          />
                                        </section>
                                      )}
                                    </div>
                                  );
                                })}

                                {!subtopics.length && (
                                  <div className="unit-subtopic-empty">
                                    No recordings yet.
                                  </div>
                                )}
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

        {selectedSubjectData?.units &&
          query.trim() &&
          !hasAnyFilteredTopic(selectedSubjectData.units, query) && (
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
  const permittedUnits = (subject.units ?? []).filter((unit) =>
    (unit.allowedEmails ?? []).includes(email),
  );

  if (subject.units?.length) {
    if (!permittedUnits.length) return null;

    const permittedTopics = permittedUnits.flatMap((unit) => unit.topics);

    return {
      ...subject,
      units: permittedUnits,
      topics: Array.from(new Set(permittedTopics)),
    };
  }

  return null;
}

function groupPdfsBySubject(pdfs: PdfResource[]) {
  const grouped = pdfs.reduce<Record<string, PdfResource[]>>((groups, pdf) => {
    const subjectName = pdf.pdfSubjectName ?? "Unassigned";
    groups[subjectName] = [...(groups[subjectName] ?? []), pdf];
    return groups;
  }, {});

  return Object.entries(grouped).map(([subjectName, groupedPdfs]) => ({
    subjectName,
    pdfs: groupedPdfs,
  }));
}

function getPdfSubjectOptions(pdfs: PdfResource[]) {
  const grouped = pdfs.reduce<
    Record<string, { id: string; name: string; count: number }>
  >((groups, pdf) => {
    const id = pdf.pdfSubjectId ?? "unassigned";
    const name = pdf.pdfSubjectName ?? "Unassigned";
    const current = groups[id] ?? { id, name, count: 0 };
    groups[id] = { ...current, count: current.count + 1 };
    return groups;
  }, {});

  return Object.values(grouped);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickSubjectColor(index: number) {
  const colors = [
    "#2563eb",
    "#059669",
    "#dc2626",
    "#7c3aed",
    "#d97706",
    "#0891b2",
  ];
  return colors[index % colors.length];
}

function hydrateSubjectTopics(subjects: Subject[], lessons: Lesson[]) {
  return subjects.map((subject) => {
    const seedSubject = subjectsSeed.find((item) => item.id === subject.id);
    const savedTopics = subject.topics ?? [];
    const seedTopics = seedSubject?.topics ?? [];
    const lessonTopics = lessons
      .filter((lesson) => lesson.subjectId === subject.id)
      .map((lesson) => lesson.topic)
      .filter(Boolean);

    return {
      ...subject,
      name: seedSubject?.name ?? subject.name,
      allowedEmails: [],
      units: seedSubject?.units ?? subject.units,
      topics: Array.from(
        new Set([...seedTopics, ...savedTopics, ...lessonTopics]),
      ),
    };
  });
}

function mergeSeedLessons(savedLessons: Lesson[]) {
  const seedById = new Map(lessonsSeed.map((lesson) => [lesson.id, lesson]));
  const updatedSavedLessons = savedLessons.map(
    (lesson) => seedById.get(lesson.id) ?? lesson,
  );
  const savedIds = new Set(updatedSavedLessons.map((lesson) => lesson.id));
  const missingSeedLessons = lessonsSeed.filter(
    (lesson) => !savedIds.has(lesson.id),
  );

  return [...updatedSavedLessons, ...missingSeedLessons];
}

function getUnitTopics(unit: CourseUnit): CourseTopic[] {
  if (unit.topicItems?.length) return unit.topicItems;

  return unit.topics.map((topic) => ({
    id: `${unit.id}-${slugify(topic)}`,
    title: topic,
    subtopics: [],
  }));
}

function getFilteredUnitTopics(unit: CourseUnit, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const topics = getUnitTopics(unit);

  if (!normalizedQuery) return topics;

  return topics.filter((topic) => {
    const subtopicText = topic.subtopics
      .map((subtopic) => subtopic.title)
      .join(" ");
    return `${topic.title} ${subtopicText}`
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

function hasAnyFilteredTopic(units: CourseUnit[], query: string) {
  return units.some((unit) => getFilteredUnitTopics(unit, query).length > 0);
}

function getTopicSubtopics(
  topic: CourseTopic,
  lesson?: Lesson,
): CourseSubtopic[] {
  if (topic.subtopics.length) return topic.subtopics;
  if (!lesson) return [];

  return [
    {
      id: `${topic.id}-recording`,
      title: lesson.title,
      driveUrl: lesson.driveUrl,
    },
  ];
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function replaceLegacySubjectWithIt(savedSubjects: Subject[]) {
  const withoutLegacySubjects = savedSubjects.filter(
    (subject) => subject.id !== "business",
  );
  const savedIds = new Set(withoutLegacySubjects.map((subject) => subject.id));
  const missingSeedSubjects = subjectsSeed.filter(
    (subject) => !savedIds.has(subject.id),
  );

  return [...withoutLegacySubjects, ...missingSeedSubjects];
}

function removeLegacySubjectLessons(savedLessons: Lesson[]) {
  return savedLessons.filter((lesson) => lesson.subjectId !== "business");
}

function parseDurationToMinutes(duration: string) {
  const match = duration.match(/\d+/);
  return match ? Number(match[0]) : 0;
}
