"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  GraduationCap,
  Layers3,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import type { CourseTopic, CourseUnit, Subject } from "@/lib/lessons";

export default function AdminPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [email, setEmail] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});
  const [editingTopicId, setEditingTopicId] = useState("");
  const [topicEditDrafts, setTopicEditDrafts] = useState<Record<string, string>>({});
  const [subtopicDrafts, setSubtopicDrafts] = useState<Record<string, { title: string; driveUrl: string }>>({});
  const [editingSubtopicId, setEditingSubtopicId] = useState("");
  const [subtopicEditDrafts, setSubtopicEditDrafts] = useState<
    Record<string, { title: string; driveUrl: string }>
  >({});
  const [unitEmailDrafts, setUnitEmailDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("edexcel-auth-role") !== "admin") {
      router.replace("/");
      return;
    }

    void loadSubjects();
  }, [router]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0],
    [selectedSubjectId, subjects]
  );

  async function loadSubjects() {
    setIsLoading(true);
    const response = await fetch("/api/admin/subjects", { cache: "no-store" });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setSelectedSubjectId((current) => current || data.subjects[0]?.id || "");
    setIsLoading(false);
  }

  async function handleAddEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSubject || !email.trim()) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${selectedSubject.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setEmail("");
    setIsSaving(false);
  }

  async function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subjectName.trim()) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: subjectName })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setSelectedSubjectId(data.subjects.at(-1)?.id ?? selectedSubjectId);
    setSubjectName("");
    setIsSaving(false);
  }

  async function handleAddUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSubject || !unitTitle.trim()) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${selectedSubject.id}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: unitTitle })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setUnitTitle("");
    setIsSaving(false);
  }

  async function handleAddTopic(event: FormEvent<HTMLFormElement>, unitId: string) {
    event.preventDefault();
    if (!selectedSubject || !topicDrafts[unitId]?.trim()) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: topicDrafts[unitId] })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setTopicDrafts((current) => ({ ...current, [unitId]: "" }));
    setIsSaving(false);
  }

  async function handleUpdateTopic(event: FormEvent<HTMLFormElement>, unitId: string, topicId: string) {
    event.preventDefault();
    const title = topicEditDrafts[topicId]?.trim();
    if (!selectedSubject || !title) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setEditingTopicId("");
    setTopicEditDrafts((current) => ({ ...current, [topicId]: "" }));
    setIsSaving(false);
  }

  async function handleAddUnitEmail(event: FormEvent<HTMLFormElement>, unitId: string) {
    event.preventDefault();
    if (!selectedSubject || !unitEmailDrafts[unitId]?.trim()) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${selectedSubject.id}/units/${unitId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unitEmailDrafts[unitId] })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setUnitEmailDrafts((current) => ({ ...current, [unitId]: "" }));
    setIsSaving(false);
  }

  async function handleRemoveUnitEmail(subjectId: string, unitId: string, emailToRemove: string) {
    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${subjectId}/units/${unitId}/access`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailToRemove })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setIsSaving(false);
  }

  async function handleAddSubtopic(event: FormEvent<HTMLFormElement>, unitId: string, topicId: string) {
    event.preventDefault();
    const draft = subtopicDrafts[topicId];
    if (!selectedSubject || !draft?.title.trim() || !draft.driveUrl.trim()) return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics/${topicId}/subtopics`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      }
    );
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setSubtopicDrafts((current) => ({ ...current, [topicId]: { title: "", driveUrl: "" } }));
    setIsSaving(false);
  }

  async function handleUpdateSubtopic(
    event: FormEvent<HTMLFormElement>,
    unitId: string,
    topicId: string,
    subtopicId: string
  ) {
    event.preventDefault();
    const draft = subtopicEditDrafts[subtopicId];
    if (!selectedSubject || !draft?.title.trim() || !draft.driveUrl.trim()) return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics/${topicId}/subtopics/${subtopicId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      }
    );
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setEditingSubtopicId("");
    setSubtopicEditDrafts((current) => ({ ...current, [subtopicId]: { title: "", driveUrl: "" } }));
    setIsSaving(false);
  }

  async function handleRemoveEmail(subjectId: string, emailToRemove: string) {
    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${subjectId}/access`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailToRemove })
    });
    const data = (await response.json()) as { subjects: Subject[] };
    setSubjects(data.subjects);
    setIsSaving(false);
  }

  function handleLogout() {
    window.localStorage.removeItem("edexcel-auth-role");
    window.localStorage.removeItem("edexcel-auth-email");
    router.push("/");
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">
          <span className="brand-mark">
            <GraduationCap size={24} aria-hidden="true" />
          </span>
          <div>
            <p>EdexcelEasy</p>
            <strong>Admin Panel</strong>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout} type="button">
          <LogOut size={17} aria-hidden="true" />
          Logout
        </button>

        <form className="admin-sidebar-form" onSubmit={handleAddSubject}>
          <label htmlFor="subjectName">New subject</label>
          <div>
            <input
              id="subjectName"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Chemistry"
            />
            <button type="submit" disabled={isSaving} title="Create subject">
              <Plus size={17} aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="admin-subject-list">
          {subjects.map((subject) => (
            <button
              className={selectedSubject?.id === subject.id ? "admin-subject-button active" : "admin-subject-button"}
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
            >
              <span className="subject-dot" style={{ background: subject.color }} />
              <span>{subject.name}</span>
              <strong>{subject.allowedEmails.length}</strong>
            </button>
          ))}
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Permissions</p>
            <h1>Subject access by Gmail</h1>
          </div>
          <span className="admin-status">
            <ShieldCheck size={17} aria-hidden="true" />
            Backend API
          </span>
        </header>

        {isLoading ? (
          <div className="admin-empty">
            <Loader2 size={28} aria-hidden="true" />
            <strong>Loading subjects</strong>
          </div>
        ) : selectedSubject ? (
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="eyebrow">{selectedSubject.name}</p>
                <h2>Allowed student Gmail accounts</h2>
              </div>
              <strong>{selectedSubject.allowedEmails.length}</strong>
            </div>

            <form className="admin-email-form" onSubmit={handleAddUnit}>
              <label htmlFor="unitTitle">
                <BookOpen size={17} aria-hidden="true" />
                New sub-subject / unit
              </label>
              <div>
                <input
                  id="unitTitle"
                  value={unitTitle}
                  onChange={(event) => setUnitTitle(event.target.value)}
                  placeholder="e.g. AS - Unit 1"
                />
                <button type="submit" disabled={isSaving}>
                  <Plus size={18} aria-hidden="true" />
                  Add unit
                </button>
              </div>
            </form>

            <div className="admin-unit-list">
              {(selectedSubject.units ?? []).map((unit) => (
                <article className="admin-unit-card" key={unit.id}>
                  <div className="admin-unit-heading">
                    <div>
                      <strong>{unit.title}</strong>
                      <span>
                        {getUnitTopics(unit).length} topics · {(unit.allowedEmails ?? []).length} unit students
                      </span>
                    </div>
                    <Layers3 size={18} aria-hidden="true" />
                  </div>

                  <form className="admin-unit-access-form" onSubmit={(event) => void handleAddUnitEmail(event, unit.id)}>
                    <input
                      value={unitEmailDrafts[unit.id] ?? ""}
                      onChange={(event) =>
                        setUnitEmailDrafts((current) => ({ ...current, [unit.id]: event.target.value }))
                      }
                      placeholder="Allow Gmail for this unit"
                      type="email"
                    />
                    <button type="submit" disabled={isSaving}>
                      <Plus size={17} aria-hidden="true" />
                    </button>
                  </form>

                  {(unit.allowedEmails ?? []).length > 0 && (
                    <div className="admin-unit-access-list">
                      {(unit.allowedEmails ?? []).map((allowedEmail) => (
                        <span key={allowedEmail}>
                          {allowedEmail}
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void handleRemoveUnitEmail(selectedSubject.id, unit.id, allowedEmail)}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <form className="admin-topic-form" onSubmit={(event) => void handleAddTopic(event, unit.id)}>
                    <input
                      value={topicDrafts[unit.id] ?? ""}
                      onChange={(event) =>
                        setTopicDrafts((current) => ({ ...current, [unit.id]: event.target.value }))
                      }
                      placeholder="Topic name"
                    />
                    <button type="submit" disabled={isSaving}>
                      <Plus size={17} aria-hidden="true" />
                    </button>
                  </form>

                  <div className="admin-topic-list">
                    {getUnitTopics(unit).map((topic) => {
                      const draft = subtopicDrafts[topic.id] ?? { title: "", driveUrl: "" };

                      return (
                        <div className="admin-topic-card" key={topic.id}>
                          {editingTopicId === topic.id ? (
                            <form
                              className="admin-topic-edit-form"
                              onSubmit={(event) => void handleUpdateTopic(event, unit.id, topic.id)}
                            >
                              <input
                                value={topicEditDrafts[topic.id] ?? topic.title}
                                onChange={(event) =>
                                  setTopicEditDrafts((current) => ({ ...current, [topic.id]: event.target.value }))
                                }
                                placeholder="Topic name"
                              />
                              <button type="submit" disabled={isSaving} title="Save topic">
                                <Check size={16} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  setEditingTopicId("");
                                  setTopicEditDrafts((current) => ({ ...current, [topic.id]: topic.title }));
                                }}
                                title="Cancel edit"
                              >
                                <X size={16} aria-hidden="true" />
                              </button>
                            </form>
                          ) : (
                            <div className="admin-topic-title-row">
                              <strong>{topic.title}</strong>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  setEditingTopicId(topic.id);
                                  setTopicEditDrafts((current) => ({ ...current, [topic.id]: topic.title }));
                                }}
                                title="Edit topic"
                              >
                                <Pencil size={15} aria-hidden="true" />
                              </button>
                            </div>
                          )}

                          <form
                            className="admin-subtopic-form"
                            onSubmit={(event) => void handleAddSubtopic(event, unit.id, topic.id)}
                          >
                            <input
                              value={draft.title}
                              onChange={(event) =>
                                setSubtopicDrafts((current) => ({
                                  ...current,
                                  [topic.id]: { ...draft, title: event.target.value }
                                }))
                              }
                              placeholder="Subtopic title"
                            />
                            <input
                              value={draft.driveUrl}
                              onChange={(event) =>
                                setSubtopicDrafts((current) => ({
                                  ...current,
                                  [topic.id]: { ...draft, driveUrl: event.target.value }
                                }))
                              }
                              placeholder="Google Drive link"
                            />
                            <button type="submit" disabled={isSaving}>
                              <Plus size={17} aria-hidden="true" />
                            </button>
                          </form>

                          <div className="admin-subtopic-list">
                            {topic.subtopics.map((subtopic) => {
                              const editDraft = subtopicEditDrafts[subtopic.id] ?? {
                                title: subtopic.title,
                                driveUrl: subtopic.driveUrl
                              };

                              if (editingSubtopicId === subtopic.id) {
                                return (
                                  <form
                                    className="admin-subtopic-edit-form"
                                    key={subtopic.id}
                                    onSubmit={(event) =>
                                      void handleUpdateSubtopic(event, unit.id, topic.id, subtopic.id)
                                    }
                                  >
                                    <input
                                      value={editDraft.title}
                                      onChange={(event) =>
                                        setSubtopicEditDrafts((current) => ({
                                          ...current,
                                          [subtopic.id]: { ...editDraft, title: event.target.value }
                                        }))
                                      }
                                      placeholder="Subtopic title"
                                    />
                                    <input
                                      value={editDraft.driveUrl}
                                      onChange={(event) =>
                                        setSubtopicEditDrafts((current) => ({
                                          ...current,
                                          [subtopic.id]: { ...editDraft, driveUrl: event.target.value }
                                        }))
                                      }
                                      placeholder="Google Drive link"
                                    />
                                    <button type="submit" disabled={isSaving} title="Save subtopic">
                                      <Check size={16} aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() => {
                                        setEditingSubtopicId("");
                                        setSubtopicEditDrafts((current) => ({
                                          ...current,
                                          [subtopic.id]: {
                                            title: subtopic.title,
                                            driveUrl: subtopic.driveUrl
                                          }
                                        }));
                                      }}
                                      title="Cancel edit"
                                    >
                                      <X size={16} aria-hidden="true" />
                                    </button>
                                  </form>
                                );
                              }

                              return (
                                <div className="admin-subtopic-row" key={subtopic.id}>
                                  <span>{subtopic.title}</span>
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => {
                                      setEditingSubtopicId(subtopic.id);
                                      setSubtopicEditDrafts((current) => ({
                                        ...current,
                                        [subtopic.id]: {
                                          title: subtopic.title,
                                          driveUrl: subtopic.driveUrl
                                        }
                                      }));
                                    }}
                                    title="Edit subtopic"
                                  >
                                    <Pencil size={14} aria-hidden="true" />
                                  </button>
                                </div>
                              );
                            })}
                            {!topic.subtopics.length && <em>No subtopics yet</em>}
                          </div>
                        </div>
                      );
                    })}
                    {!getUnitTopics(unit).length && <em>No topics yet</em>}
                  </div>
                </article>
              ))}

              {!(selectedSubject.units ?? []).length && (
                <div className="admin-empty">
                  <BookOpen size={24} aria-hidden="true" />
                  <strong>No units yet</strong>
                </div>
              )}
            </div>

            <form className="admin-email-form" onSubmit={handleAddEmail}>
              <label htmlFor="adminEmail">
                <Mail size={17} aria-hidden="true" />
                Gmail address
              </label>
              <div>
                <input
                  id="adminEmail"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@gmail.com"
                  type="email"
                />
                <button type="submit" disabled={isSaving}>
                  <Plus size={18} aria-hidden="true" />
                  Add access
                </button>
              </div>
            </form>

            <div className="admin-email-list">
              {selectedSubject.allowedEmails.map((allowedEmail) => (
                <div className="admin-email-row" key={allowedEmail}>
                  <span>{allowedEmail}</span>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleRemoveEmail(selectedSubject.id, allowedEmail)}
                    title="Remove Gmail access"
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              ))}

              {!selectedSubject.allowedEmails.length && (
                <div className="admin-empty">
                  <Mail size={24} aria-hidden="true" />
                  <strong>No Gmail access yet</strong>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function getUnitTopics(unit: CourseUnit): CourseTopic[] {
  if (unit.topicItems?.length) return unit.topicItems;

  return unit.topics.map((topic) => ({
    id: `${unit.id}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    title: topic,
    subtopics: []
  }));
}
