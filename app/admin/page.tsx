"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  FileText,
  Layers3,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type {
  CourseTopic,
  CourseUnit,
  PdfResource,
  PdfSubject,
  Subject,
} from "@/lib/lessons";

type AdminSection = "subjects" | "pdf";

export default function AdminPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pdfs, setPdfs] = useState<PdfResource[]>([]);
  const [pdfSubjects, setPdfSubjects] = useState<PdfSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedPdfSubjectId, setSelectedPdfSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [pdfSubjectName, setPdfSubjectName] = useState("");
  const [pdfDraft, setPdfDraft] = useState({
    title: "",
    driveUrl: "",
    pdfSubjectId: "",
  });
  const [pdfEmailDrafts, setPdfEmailDrafts] = useState<Record<string, string>>(
    {},
  );
  const [unitTitle, setUnitTitle] = useState("");
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});
  const [editingTopicId, setEditingTopicId] = useState("");
  const [topicEditDrafts, setTopicEditDrafts] = useState<
    Record<string, string>
  >({});
  const [subtopicDrafts, setSubtopicDrafts] = useState<
    Record<string, { title: string; driveUrl: string }>
  >({});
  const [editingSubtopicId, setEditingSubtopicId] = useState("");
  const [subtopicEditDrafts, setSubtopicEditDrafts] = useState<
    Record<string, { title: string; driveUrl: string }>
  >({});
  const [unitEmailDrafts, setUnitEmailDrafts] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (window.localStorage.getItem("edexcel-auth-role") !== "admin") {
      router.replace("/");
      return;
    }

    void loadSubjects();
    void loadPdfs();
    void loadPdfSubjects();
  }, [router]);

  const selectedSubject = useMemo(
    () =>
      subjects.find((subject) => subject.id === selectedSubjectId) ??
      subjects[0],
    [selectedSubjectId, subjects],
  );
  const selectedPdfSubject = useMemo(
    () =>
      pdfSubjects.find((subject) => subject.id === selectedPdfSubjectId) ??
      pdfSubjects[0],
    [pdfSubjects, selectedPdfSubjectId],
  );
  const selectedPdfSubjectPdfs = useMemo(
    () =>
      pdfs.filter((pdf) => (pdf.pdfSubjectId ?? "") === selectedPdfSubject?.id),
    [pdfs, selectedPdfSubject],
  );

  async function loadSubjects(showLoading = true, preferredSubjectId?: string) {
    if (showLoading) setIsLoading(true);
    setLoadError("");

    try {
      const data = await readSubjectsResponse(
        await fetch("/api/admin/subjects", { cache: "no-store" }),
      );
      setSubjects(data.subjects);
      setSelectedSubjectId(
        (current) =>
          preferredSubjectId || current || data.subjects[0]?.id || "",
      );
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load subjects.",
      );
      setSubjects([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  function applySubjects(
    data: { subjects: Subject[] },
    preferredSubjectId?: string,
  ) {
    setSubjects(data.subjects);
    setSelectedSubjectId((current) => {
      const nextSubjectId = preferredSubjectId ?? current;
      if (
        nextSubjectId &&
        data.subjects.some((subject) => subject.id === nextSubjectId)
      )
        return nextSubjectId;

      return data.subjects[0]?.id ?? "";
    });
  }

  async function loadPdfs() {
    try {
      const data = await readPdfsResponse(
        await fetch("/api/admin/pdfs", { cache: "no-store" }),
      );
      setPdfs(data.pdfs);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load PDFs.",
      );
    }
  }

  async function loadPdfSubjects() {
    try {
      const data = await readPdfSubjectsResponse(
        await fetch("/api/admin/pdf-subjects", { cache: "no-store" }),
      );
      setPdfSubjects(data.pdfSubjects);
      setSelectedPdfSubjectId(
        (current) => current || data.pdfSubjects[0]?.id || "",
      );
      setPdfDraft((current) => ({
        ...current,
        pdfSubjectId: current.pdfSubjectId || data.pdfSubjects[0]?.id || "",
      }));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load PDF subjects.",
      );
    }
  }

  async function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subjectName.trim()) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: subjectName }),
    });
    const data = await readSubjectsResponse(response);
    const newSubjectId = slugify(subjectName);
    applySubjects(
      data,
      data.subjects.some((subject) => subject.id === newSubjectId)
        ? newSubjectId
        : selectedSubjectId,
    );
    setSubjectName("");
    setIsSaving(false);
  }

  async function handleAddPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !pdfDraft.title.trim() ||
      !pdfDraft.driveUrl.trim() ||
      !pdfDraft.pdfSubjectId
    )
      return;

    setIsSaving(true);
    const response = await fetch("/api/admin/pdfs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pdfDraft),
    });
    const data = await readPdfsResponse(response);
    setPdfs(data.pdfs);
    setPdfDraft((current) => ({
      title: "",
      driveUrl: "",
      pdfSubjectId: current.pdfSubjectId,
    }));
    setIsSaving(false);
  }

  async function handleAddPdfSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pdfSubjectName.trim()) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/pdf-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pdfSubjectName }),
    });
    const data = await readPdfSubjectsResponse(response);
    setPdfSubjects(data.pdfSubjects);
    const newSubjectId = slugify(pdfSubjectName);
    setSelectedPdfSubjectId(
      data.pdfSubjects.some((subject) => subject.id === newSubjectId)
        ? newSubjectId
        : (data.pdfSubjects[0]?.id ?? ""),
    );
    setPdfDraft((current) => ({
      ...current,
      pdfSubjectId: data.pdfSubjects.some(
        (subject) => subject.id === newSubjectId,
      )
        ? newSubjectId
        : current.pdfSubjectId || data.pdfSubjects[0]?.id || "",
    }));
    setPdfSubjectName("");
    setIsSaving(false);
  }

  async function handleDeletePdf(pdfId: string, pdfTitle: string) {
    if (!window.confirm(`Delete ${pdfTitle}?`)) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/pdfs/${pdfId}`, {
      method: "DELETE",
    });
    const data = await readPdfsResponse(response);
    setPdfs(data.pdfs);
    setIsSaving(false);
  }

  async function handleAddPdfEmail(
    event: FormEvent<HTMLFormElement>,
    pdfId: string,
  ) {
    event.preventDefault();
    if (!pdfEmailDrafts[pdfId]?.trim()) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/pdfs/${pdfId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pdfEmailDrafts[pdfId] }),
    });
    const data = await readPdfsResponse(response);
    setPdfs(data.pdfs);
    setPdfEmailDrafts((current) => ({ ...current, [pdfId]: "" }));
    setIsSaving(false);
  }

  async function handleRemovePdfEmail(pdfId: string, email: string) {
    setIsSaving(true);
    const response = await fetch(`/api/admin/pdfs/${pdfId}/access`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await readPdfsResponse(response);
    setPdfs(data.pdfs);
    setIsSaving(false);
  }

  async function handleAddUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSubject || !unitTitle.trim()) return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: unitTitle }),
      },
    );
    applySubjects(await readSubjectsResponse(response), selectedSubject.id);
    setUnitTitle("");
    setIsSaving(false);
  }

  async function handleAddTopic(
    event: FormEvent<HTMLFormElement>,
    unitId: string,
  ) {
    event.preventDefault();
    if (!selectedSubject || !topicDrafts[unitId]?.trim()) return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicDrafts[unitId] }),
      },
    );
    applySubjects(await readSubjectsResponse(response), selectedSubject.id);
    setTopicDrafts((current) => ({ ...current, [unitId]: "" }));
    setIsSaving(false);
  }

  async function handleUpdateTopic(
    event: FormEvent<HTMLFormElement>,
    unitId: string,
    topicId: string,
  ) {
    event.preventDefault();
    const title = topicEditDrafts[topicId]?.trim();
    if (!selectedSubject || !title) return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics/${topicId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      },
    );
    applySubjects(await readSubjectsResponse(response), selectedSubject.id);
    setEditingTopicId("");
    setTopicEditDrafts((current) => ({ ...current, [topicId]: "" }));
    setIsSaving(false);
  }

  async function handleAddUnitEmail(
    event: FormEvent<HTMLFormElement>,
    unitId: string,
  ) {
    event.preventDefault();
    if (!selectedSubject || !unitEmailDrafts[unitId]?.trim()) return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/access`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unitEmailDrafts[unitId] }),
      },
    );
    applySubjects(await readSubjectsResponse(response), selectedSubject.id);
    setUnitEmailDrafts((current) => ({ ...current, [unitId]: "" }));
    setIsSaving(false);
  }

  async function handleRemoveUnitEmail(
    subjectId: string,
    unitId: string,
    emailToRemove: string,
  ) {
    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${subjectId}/units/${unitId}/access`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToRemove }),
      },
    );
    applySubjects(await readSubjectsResponse(response), subjectId);
    setIsSaving(false);
  }

  async function handleAddSubtopic(
    event: FormEvent<HTMLFormElement>,
    unitId: string,
    topicId: string,
  ) {
    event.preventDefault();
    const draft = subtopicDrafts[topicId];
    if (!selectedSubject || !draft?.title.trim() || !draft.driveUrl.trim())
      return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics/${topicId}/subtopics`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      },
    );
    applySubjects(await readSubjectsResponse(response), selectedSubject.id);
    setSubtopicDrafts((current) => ({
      ...current,
      [topicId]: { title: "", driveUrl: "" },
    }));
    setIsSaving(false);
  }

  async function handleUpdateSubtopic(
    event: FormEvent<HTMLFormElement>,
    unitId: string,
    topicId: string,
    subtopicId: string,
  ) {
    event.preventDefault();
    const draft = subtopicEditDrafts[subtopicId];
    if (!selectedSubject || !draft?.title.trim() || !draft.driveUrl.trim())
      return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics/${topicId}/subtopics/${subtopicId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      },
    );
    applySubjects(await readSubjectsResponse(response), selectedSubject.id);
    setEditingSubtopicId("");
    setSubtopicEditDrafts((current) => ({
      ...current,
      [subtopicId]: { title: "", driveUrl: "" },
    }));
    setIsSaving(false);
  }

  async function handleDeleteSubtopic(
    unitId: string,
    topicId: string,
    subtopicId: string,
    subtopicTitle: string,
  ) {
    if (!selectedSubject) return;
    if (!window.confirm(`Delete ${subtopicTitle}?`)) return;

    setIsSaving(true);
    const response = await fetch(
      `/api/admin/subjects/${selectedSubject.id}/units/${unitId}/topics/${topicId}/subtopics/${subtopicId}`,
      {
        method: "DELETE",
      },
    );
    applySubjects(await readSubjectsResponse(response), selectedSubject.id);
    setEditingSubtopicId((current) => (current === subtopicId ? "" : current));
    setIsSaving(false);
  }

  async function handleDeleteSubject(subjectId: string, subjectName: string) {
    if (
      !window.confirm(
        `Delete ${subjectName}? This will also remove its units, topics, and unit access list.`,
      )
    )
      return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${subjectId}`, {
      method: "DELETE",
    });
    const data = await readSubjectsResponse(response);
    const nextSubjectId =
      selectedSubjectId === subjectId
        ? (data.subjects[0]?.id ?? "")
        : selectedSubjectId;

    applySubjects(data, nextSubjectId);
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
            <img className="brand-logo" src="/logo.png" alt="" />
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

        <div className="admin-section-switch">
          <button
            className={activeSection === "subjects" ? "active" : ""}
            type="button"
            onClick={() => setActiveSection("subjects")}
          >
            <BookOpen size={17} aria-hidden="true" />
            Subjects
          </button>
          <button
            className={activeSection === "pdf" ? "active" : ""}
            type="button"
            onClick={() => setActiveSection("pdf")}
          >
            <FileText size={17} aria-hidden="true" />
            PDF
          </button>
        </div>

        {activeSection === "subjects" && (
          <>
            <form className="admin-sidebar-form" onSubmit={handleAddSubject}>
              <label htmlFor="subjectName">New subject</label>
              <div>
                <input
                  id="subjectName"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                  placeholder="e.g. Chemistry"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  title="Create subject"
                >
                  <Plus size={17} aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="admin-subject-list">
              {subjects.map((subject) => (
                <div className="admin-subject-row" key={subject.id}>
                  <button
                    className={
                      selectedSubject?.id === subject.id
                        ? "admin-subject-button active"
                        : "admin-subject-button"
                    }
                    onClick={() => setSelectedSubjectId(subject.id)}
                    type="button"
                  >
                    <span
                      className="subject-dot"
                      style={{ background: subject.color }}
                    />
                    <span>{subject.name}</span>
                  </button>
                  <button
                    className="admin-subject-delete"
                    disabled={isSaving}
                    onClick={() =>
                      void handleDeleteSubject(subject.id, subject.name)
                    }
                    title={`Delete ${subject.name}`}
                    type="button"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeSection === "pdf" && (
          <>
            <form className="admin-sidebar-form" onSubmit={handleAddPdfSubject}>
              <label htmlFor="pdfSubjectName">New PDF subject</label>
              <div>
                <input
                  id="pdfSubjectName"
                  value={pdfSubjectName}
                  onChange={(event) => setPdfSubjectName(event.target.value)}
                  placeholder="e.g. Formula sheets"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  title="Create PDF subject"
                >
                  <Plus size={17} aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="admin-subject-list">
              {pdfSubjects.map((subject) => (
                <div className="admin-subject-row" key={subject.id}>
                  <button
                    className={
                      selectedPdfSubject?.id === subject.id
                        ? "admin-subject-button active"
                        : "admin-subject-button"
                    }
                    onClick={() => {
                      setSelectedPdfSubjectId(subject.id);
                      setPdfDraft((current) => ({
                        ...current,
                        pdfSubjectId: subject.id,
                      }));
                    }}
                    type="button"
                  >
                    <span className="subject-dot pdf-dot" />
                    <span>{subject.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="eyebrow">
              {activeSection === "pdf" ? "Resources" : "Permissions"}
            </p>
            <h1>{activeSection === "pdf" ? "PDF library" : "Welcome Admin"}</h1>
          </div>
        </header>

        {activeSection === "pdf" ? (
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="eyebrow">{selectedPdfSubject?.name ?? "PDF"}</p>
                <h2>Google Drive PDF resources</h2>
              </div>
              <strong>{selectedPdfSubjectPdfs.length}</strong>
            </div>

            <form className="admin-pdf-form" onSubmit={handleAddPdf}>
              <input
                value={pdfDraft.title}
                onChange={(event) =>
                  setPdfDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="PDF title"
              />
              <input
                value={pdfDraft.driveUrl}
                onChange={(event) =>
                  setPdfDraft((current) => ({
                    ...current,
                    driveUrl: event.target.value,
                  }))
                }
                placeholder="Google Drive PDF link"
              />
              <button type="submit" disabled={isSaving}>
                <Plus size={17} aria-hidden="true" />
                Add PDF
              </button>
            </form>

            <div className="admin-pdf-list">
              {selectedPdfSubjectPdfs.map((pdf) => (
                <div className="admin-pdf-row" key={pdf.id}>
                  <div className="admin-pdf-main">
                    <span>
                      <FileText size={17} aria-hidden="true" />
                      {pdf.title}
                    </span>
                    <small>
                      {pdf.pdfSubjectName ?? "Unassigned"} ·{" "}
                      {(pdf.allowedEmails ?? []).length} allowed students
                    </small>
                  </div>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleDeletePdf(pdf.id, pdf.title)}
                    title={`Delete ${pdf.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                  <form
                    className="admin-pdf-access-form"
                    onSubmit={(event) => void handleAddPdfEmail(event, pdf.id)}
                  >
                    <input
                      value={pdfEmailDrafts[pdf.id] ?? ""}
                      onChange={(event) =>
                        setPdfEmailDrafts((current) => ({
                          ...current,
                          [pdf.id]: event.target.value,
                        }))
                      }
                      placeholder="Allow Gmail for this PDF"
                      type="email"
                    />
                    <button type="submit" disabled={isSaving}>
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </form>
                  {(pdf.allowedEmails ?? []).length > 0 && (
                    <div className="admin-pdf-access-list">
                      {(pdf.allowedEmails ?? []).map((allowedEmail) => (
                        <span key={allowedEmail}>
                          {allowedEmail}
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() =>
                              void handleRemovePdfEmail(pdf.id, allowedEmail)
                            }
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {!selectedPdfSubjectPdfs.length && (
                <div className="admin-empty">
                  <FileText size={24} aria-hidden="true" />
                  <strong>No PDFs in this subject yet</strong>
                </div>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className="admin-empty">
            <Loader2 size={28} aria-hidden="true" />
            <strong>Loading subjects</strong>
          </div>
        ) : loadError ? (
          <div className="admin-empty">
            <X size={28} aria-hidden="true" />
            <strong>Database setup error</strong>
            <span>{loadError}</span>
          </div>
        ) : selectedSubject ? (
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="eyebrow">{selectedSubject.name}</p>
                <h2>Units and lesson access</h2>
              </div>
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
                        {getUnitTopics(unit).length} topics ·{" "}
                        {(unit.allowedEmails ?? []).length} unit students
                      </span>
                    </div>
                    <Layers3 size={18} aria-hidden="true" />
                  </div>

                  <form
                    className="admin-unit-access-form"
                    onSubmit={(event) =>
                      void handleAddUnitEmail(event, unit.id)
                    }
                  >
                    <input
                      value={unitEmailDrafts[unit.id] ?? ""}
                      onChange={(event) =>
                        setUnitEmailDrafts((current) => ({
                          ...current,
                          [unit.id]: event.target.value,
                        }))
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
                            onClick={() =>
                              void handleRemoveUnitEmail(
                                selectedSubject.id,
                                unit.id,
                                allowedEmail,
                              )
                            }
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <form
                    className="admin-topic-form"
                    onSubmit={(event) => void handleAddTopic(event, unit.id)}
                  >
                    <input
                      value={topicDrafts[unit.id] ?? ""}
                      onChange={(event) =>
                        setTopicDrafts((current) => ({
                          ...current,
                          [unit.id]: event.target.value,
                        }))
                      }
                      placeholder="Topic name"
                    />
                    <button type="submit" disabled={isSaving}>
                      <Plus size={17} aria-hidden="true" />
                    </button>
                  </form>

                  <div className="admin-topic-list">
                    {getUnitTopics(unit).map((topic) => {
                      const draft = subtopicDrafts[topic.id] ?? {
                        title: "",
                        driveUrl: "",
                      };

                      return (
                        <div className="admin-topic-card" key={topic.id}>
                          {editingTopicId === topic.id ? (
                            <form
                              className="admin-topic-edit-form"
                              onSubmit={(event) =>
                                void handleUpdateTopic(event, unit.id, topic.id)
                              }
                            >
                              <input
                                value={topicEditDrafts[topic.id] ?? topic.title}
                                onChange={(event) =>
                                  setTopicEditDrafts((current) => ({
                                    ...current,
                                    [topic.id]: event.target.value,
                                  }))
                                }
                                placeholder="Topic name"
                              />
                              <button
                                type="submit"
                                disabled={isSaving}
                                title="Save topic"
                              >
                                <Check size={16} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  setEditingTopicId("");
                                  setTopicEditDrafts((current) => ({
                                    ...current,
                                    [topic.id]: topic.title,
                                  }));
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
                                  setTopicEditDrafts((current) => ({
                                    ...current,
                                    [topic.id]: topic.title,
                                  }));
                                }}
                                title="Edit topic"
                              >
                                <Pencil size={15} aria-hidden="true" />
                              </button>
                            </div>
                          )}

                          <form
                            className="admin-subtopic-form"
                            onSubmit={(event) =>
                              void handleAddSubtopic(event, unit.id, topic.id)
                            }
                          >
                            <input
                              value={draft.title}
                              onChange={(event) =>
                                setSubtopicDrafts((current) => ({
                                  ...current,
                                  [topic.id]: {
                                    ...draft,
                                    title: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Subtopic title"
                            />
                            <input
                              value={draft.driveUrl}
                              onChange={(event) =>
                                setSubtopicDrafts((current) => ({
                                  ...current,
                                  [topic.id]: {
                                    ...draft,
                                    driveUrl: event.target.value,
                                  },
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
                              const editDraft = subtopicEditDrafts[
                                subtopic.id
                              ] ?? {
                                title: subtopic.title,
                                driveUrl: subtopic.driveUrl,
                              };

                              if (editingSubtopicId === subtopic.id) {
                                return (
                                  <form
                                    className="admin-subtopic-edit-form"
                                    key={subtopic.id}
                                    onSubmit={(event) =>
                                      void handleUpdateSubtopic(
                                        event,
                                        unit.id,
                                        topic.id,
                                        subtopic.id,
                                      )
                                    }
                                  >
                                    <input
                                      value={editDraft.title}
                                      onChange={(event) =>
                                        setSubtopicEditDrafts((current) => ({
                                          ...current,
                                          [subtopic.id]: {
                                            ...editDraft,
                                            title: event.target.value,
                                          },
                                        }))
                                      }
                                      placeholder="Subtopic title"
                                    />
                                    <input
                                      value={editDraft.driveUrl}
                                      onChange={(event) =>
                                        setSubtopicEditDrafts((current) => ({
                                          ...current,
                                          [subtopic.id]: {
                                            ...editDraft,
                                            driveUrl: event.target.value,
                                          },
                                        }))
                                      }
                                      placeholder="Google Drive link"
                                    />
                                    <button
                                      type="submit"
                                      disabled={isSaving}
                                      title="Save subtopic"
                                    >
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
                                            driveUrl: subtopic.driveUrl,
                                          },
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
                                <div
                                  className="admin-subtopic-row"
                                  key={subtopic.id}
                                >
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
                                          driveUrl: subtopic.driveUrl,
                                        },
                                      }));
                                    }}
                                    title="Edit subtopic"
                                  >
                                    <Pencil size={14} aria-hidden="true" />
                                  </button>
                                  <button
                                    className="danger"
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() =>
                                      void handleDeleteSubtopic(
                                        unit.id,
                                        topic.id,
                                        subtopic.id,
                                        subtopic.title,
                                      )
                                    }
                                    title="Delete subtopic"
                                  >
                                    <Trash2 size={14} aria-hidden="true" />
                                  </button>
                                </div>
                              );
                            })}
                            {!topic.subtopics.length && (
                              <em>No subtopics yet</em>
                            )}
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
          </div>
        ) : null}
      </section>
    </main>
  );
}

function getUnitTopics(unit: CourseUnit): CourseTopic[] {
  if (unit.topicItems?.length) return unit.topicItems;

  return unit.topics.map((topic) => ({
    id: `${unit.id}-${slugify(topic)}`,
    title: topic,
    subtopics: [],
  }));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readSubjectsResponse(response: Response) {
  const text = await response.text();
  const data = text
    ? (JSON.parse(text) as { subjects?: Subject[]; error?: string })
    : {};

  if (!response.ok) {
    throw new Error(
      data.error ?? `Request failed with status ${response.status}.`,
    );
  }

  return { subjects: data.subjects ?? [] };
}

async function readPdfsResponse(response: Response) {
  const text = await response.text();
  const data = text
    ? (JSON.parse(text) as { pdfs?: PdfResource[]; error?: string })
    : {};

  if (!response.ok) {
    throw new Error(
      data.error ?? `Request failed with status ${response.status}.`,
    );
  }

  return { pdfs: data.pdfs ?? [] };
}

async function readPdfSubjectsResponse(response: Response) {
  const text = await response.text();
  const data = text
    ? (JSON.parse(text) as { pdfSubjects?: PdfSubject[]; error?: string })
    : {};

  if (!response.ok) {
    throw new Error(
      data.error ?? `Request failed with status ${response.status}.`,
    );
  }

  return { pdfSubjects: data.pdfSubjects ?? [] };
}
