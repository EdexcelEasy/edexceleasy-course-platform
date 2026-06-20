"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  Layers3,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type {
  CourseTopic,
  CourseUnit,
  PdfResource,
  PdfSubject,
  Subject,
} from "@/lib/lessons";

type AdminSection = "subjects" | "pdf" | "students" | "admins";

type RegisteredStudent = {
  email: string;
  fullName: string | null;
  createdAt: string;
};

async function readAdminStudentsResponse(response: Response) {
  const text = await response.text();
  const data = text
    ? (JSON.parse(text) as {
        students?: RegisteredStudent[];
        admins?: RegisteredStudent[];
        error?: string;
      })
    : {};

  if (!response.ok) {
    throw new Error(
      data.error ?? `Request failed with status ${response.status}.`,
    );
  }

  return { students: data.students ?? [], admins: data.admins ?? [] };
}

export default function AdminPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pdfs, setPdfs] = useState<PdfResource[]>([]);
  const [pdfSubjects, setPdfSubjects] = useState<PdfSubject[]>([]);
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [admins, setAdmins] = useState<RegisteredStudent[]>([]);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedPdfSubjectId, setSelectedPdfSubjectId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState("");
  const [subjectEditDrafts, setSubjectEditDrafts] = useState<
    Record<string, string>
  >({});
  const [pdfSubjectName, setPdfSubjectName] = useState("");
  const [editingPdfSubjectId, setEditingPdfSubjectId] = useState("");
  const [pdfSubjectEditDrafts, setPdfSubjectEditDrafts] = useState<
    Record<string, string>
  >({});
  const [pdfDraft, setPdfDraft] = useState({
    title: "",
    driveUrl: "",
    pdfSubjectId: "",
  });
  const [studentDraft, setStudentDraft] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [adminDraft, setAdminDraft] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [editingStudentEmail, setEditingStudentEmail] = useState("");
  const [editingAdminEmail, setEditingAdminEmail] = useState("");
  const [studentEditDrafts, setStudentEditDrafts] = useState<
    Record<string, { email: string; password: string; fullName: string }>
  >({});
  const [adminEditDrafts, setAdminEditDrafts] = useState<
    Record<string, { email: string; password: string; fullName: string }>
  >({});
  const [pdfEmailDrafts, setPdfEmailDrafts] = useState<Record<string, string>>(
    {},
  );
  const [unitTitle, setUnitTitle] = useState("");
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});
  const [editingTopicId, setEditingTopicId] = useState("");
  const [openAdminUnits, setOpenAdminUnits] = useState<Record<string, boolean>>(
    {},
  );
  const [openAdminTopics, setOpenAdminTopics] = useState<
    Record<string, boolean>
  >({});
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
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    if (window.localStorage.getItem("edexcel-auth-role") !== "admin") {
      router.replace("/");
      return;
    }

    setAdminEmail(
      window.localStorage.getItem("edexcel-auth-email")?.toLowerCase() ?? "",
    );
    void loadSubjects();
    void loadPdfs();
    void loadPdfSubjects();
    void loadStudents();
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
  const currentAdminName = useMemo(() => {
    const currentAdmin = admins.find((admin) => admin.email === adminEmail);

    return currentAdmin?.fullName || currentAdmin?.email || adminEmail || "Admin";
  }, [adminEmail, admins]);

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

  async function loadStudents() {
    try {
      const data = await readAdminStudentsResponse(
        await fetch("/api/admin/users", { cache: "no-store" }),
      );
      setStudents(data.students);
      setAdmins(data.admins);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load students.",
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

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentDraft.email.trim() || !studentDraft.password.trim()) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...studentDraft, role: "student" }),
    });
    const data = await readAdminStudentsResponse(response);
    setStudents(data.students);
    setStudentDraft({ email: "", password: "", fullName: "" });
    setIsSaving(false);
  }

  async function handleAddAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminDraft.email.trim() || !adminDraft.password.trim()) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...adminDraft, role: "admin" }),
    });
    const data = await readAdminStudentsResponse(response);
    setAdmins(data.admins);
    setAdminDraft({ email: "", password: "", fullName: "" });
    setIsSaving(false);
  }

  function startEditingStudent(student: RegisteredStudent) {
    setEditingStudentEmail(student.email);
    setStudentEditDrafts((current) => ({
      ...current,
      [student.email]: {
        email: student.email,
        password: "",
        fullName: student.fullName ?? "",
      },
    }));
  }

  function startEditingAdmin(admin: RegisteredStudent) {
    setEditingAdminEmail(admin.email);
    setAdminEditDrafts((current) => ({
      ...current,
      [admin.email]: {
        email: admin.email,
        password: "",
        fullName: admin.fullName ?? "",
      },
    }));
  }

  async function handleUpdateStudent(
    event: FormEvent<HTMLFormElement>,
    currentEmail: string,
  ) {
    event.preventDefault();
    const draft = studentEditDrafts[currentEmail];
    if (!draft?.email.trim()) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentEmail, ...draft, role: "student" }),
    });
    const data = await readAdminStudentsResponse(response);
    setStudents(data.students);
    setEditingStudentEmail("");
    setStudentEditDrafts((current) => ({ ...current, [currentEmail]: draft }));
    setIsSaving(false);
  }

  async function handleUpdateAdmin(
    event: FormEvent<HTMLFormElement>,
    currentEmail: string,
  ) {
    event.preventDefault();
    const draft = adminEditDrafts[currentEmail];
    if (!draft?.email.trim()) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentEmail, ...draft, role: "admin" }),
    });
    const data = await readAdminStudentsResponse(response);
    setAdmins(data.admins);
    setEditingAdminEmail("");
    setAdminEditDrafts((current) => ({ ...current, [currentEmail]: draft }));
    setIsSaving(false);
  }

  async function handleDeleteStudent(email: string) {
    if (!window.confirm(`Delete registered student ${email}?`)) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "student" }),
    });
    const data = await readAdminStudentsResponse(response);
    setStudents(data.students);
    setEditingStudentEmail((current) => (current === email ? "" : current));
    setIsSaving(false);
  }

  async function handleDeleteAdmin(email: string) {
    if (!window.confirm(`Delete admin ${email}?`)) return;

    setIsSaving(true);
    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "admin" }),
    });
    const data = await readAdminStudentsResponse(response);
    setAdmins(data.admins);
    setEditingAdminEmail((current) => (current === email ? "" : current));
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

  async function handleUpdatePdfSubject(
    event: FormEvent<HTMLFormElement>,
    subjectId: string,
  ) {
    event.preventDefault();
    const name = pdfSubjectEditDrafts[subjectId]?.trim();
    if (!name) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/pdf-subjects/${subjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await readPdfSubjectsResponse(response);
    setPdfSubjects(data.pdfSubjects);
    setSelectedPdfSubjectId(subjectId);
    setEditingPdfSubjectId("");
    setPdfSubjectEditDrafts((current) => ({ ...current, [subjectId]: "" }));
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

  async function handleUpdateSubject(
    event: FormEvent<HTMLFormElement>,
    subjectId: string,
  ) {
    event.preventDefault();
    const name = subjectEditDrafts[subjectId]?.trim();
    if (!name) return;

    setIsSaving(true);
    const response = await fetch(`/api/admin/subjects/${subjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    applySubjects(await readSubjectsResponse(response), subjectId);
    setEditingSubjectId("");
    setSubjectEditDrafts((current) => ({ ...current, [subjectId]: "" }));
    setIsSaving(false);
  }

  function handleLogout() {
    window.localStorage.removeItem("edexcel-auth-role");
    window.localStorage.removeItem("edexcel-auth-email");
    window.localStorage.removeItem("edexcel-auth-name");
    router.push("/");
  }

  function selectAdminSection(section: AdminSection) {
    setActiveSection(section);
    setIsSectionMenuOpen(false);
  }

  function isAdminUnitOpen(unitId: string) {
    return openAdminUnits[unitId] ?? false;
  }

  function isAdminTopicOpen(topicId: string) {
    return openAdminTopics[topicId] ?? false;
  }

  function toggleAdminUnit(unitId: string) {
    setOpenAdminUnits((current) => ({
      ...current,
      [unitId]: !(current[unitId] ?? false),
    }));
  }

  function toggleAdminTopic(topicId: string) {
    setOpenAdminTopics((current) => ({
      ...current,
      [topicId]: !(current[topicId] ?? false),
    }));
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

        <div className="category-dropdown">
          <button
            className="category-trigger"
            type="button"
            aria-expanded={isSectionMenuOpen}
            aria-controls="adminSectionMenu"
            onClick={() => setIsSectionMenuOpen((current) => !current)}
          >
            {activeSection === "subjects" ? (
              <BookOpen size={18} aria-hidden="true" />
            ) : activeSection === "pdf" ? (
              <FileText size={18} aria-hidden="true" />
            ) : activeSection === "admins" ? (
              <Users size={18} aria-hidden="true" />
            ) : (
              <Users size={18} aria-hidden="true" />
            )}
            <span>
              {activeSection === "subjects"
                ? "Subjects"
                : activeSection === "pdf"
                  ? "PDF"
                  : activeSection === "admins"
                    ? "Register New Admin"
                    : "Register New Students"}
            </span>
            <ChevronDown size={17} aria-hidden="true" />
          </button>

          {isSectionMenuOpen && (
            <div className="category-menu" id="adminSectionMenu" role="menu">
              <button
                className={activeSection === "subjects" ? "active" : ""}
                type="button"
                role="menuitem"
                onClick={() => selectAdminSection("subjects")}
              >
                <BookOpen size={17} aria-hidden="true" />
                <span>Subjects</span>
              </button>
              <button
                className={activeSection === "pdf" ? "active" : ""}
                type="button"
                role="menuitem"
                onClick={() => selectAdminSection("pdf")}
              >
                <FileText size={17} aria-hidden="true" />
                <span>PDF</span>
              </button>
              <button
                className={activeSection === "students" ? "active" : ""}
                type="button"
                role="menuitem"
                onClick={() => selectAdminSection("students")}
              >
                <Users size={17} aria-hidden="true" />
                <span>Register New Students</span>
              </button>
              <button
                className={activeSection === "admins" ? "active" : ""}
                type="button"
                role="menuitem"
                onClick={() => selectAdminSection("admins")}
              >
                <Users size={17} aria-hidden="true" />
                <span>Register New Admin</span>
              </button>
            </div>
          )}
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
                  {editingSubjectId === subject.id ? (
                    <form
                      className="admin-subject-edit-form"
                      onSubmit={(event) =>
                        void handleUpdateSubject(event, subject.id)
                      }
                    >
                      <span
                        className="subject-dot"
                        style={{ background: subject.color }}
                      />
                      <input
                        autoFocus
                        value={subjectEditDrafts[subject.id] ?? subject.name}
                        onChange={(event) =>
                          setSubjectEditDrafts((current) => ({
                            ...current,
                            [subject.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        disabled={isSaving}
                        title={`Save ${subject.name}`}
                        type="submit"
                      >
                        <Check size={15} aria-hidden="true" />
                      </button>
                      <button
                        disabled={isSaving}
                        onClick={() => setEditingSubjectId("")}
                        title="Cancel edit"
                        type="button"
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </form>
                  ) : (
                    <>
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
                      <div className="admin-subject-actions">
                        <button
                          className="admin-subject-edit"
                          disabled={isSaving}
                          onClick={() => {
                            setEditingSubjectId(subject.id);
                            setSubjectEditDrafts((current) => ({
                              ...current,
                              [subject.id]: subject.name,
                            }));
                          }}
                          title={`Edit ${subject.name}`}
                          type="button"
                        >
                          <Pencil size={15} aria-hidden="true" />
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
                    </>
                  )}
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
                  {editingPdfSubjectId === subject.id ? (
                    <form
                      className="admin-subject-edit-form"
                      onSubmit={(event) =>
                        void handleUpdatePdfSubject(event, subject.id)
                      }
                    >
                      <span className="subject-dot pdf-dot" />
                      <input
                        autoFocus
                        value={pdfSubjectEditDrafts[subject.id] ?? subject.name}
                        onChange={(event) =>
                          setPdfSubjectEditDrafts((current) => ({
                            ...current,
                            [subject.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        disabled={isSaving}
                        title={`Save ${subject.name}`}
                        type="submit"
                      >
                        <Check size={15} aria-hidden="true" />
                      </button>
                      <button
                        disabled={isSaving}
                        onClick={() => setEditingPdfSubjectId("")}
                        title="Cancel edit"
                        type="button"
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </form>
                  ) : (
                    <>
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
                      <div className="admin-subject-actions">
                        <button
                          className="admin-subject-edit"
                          disabled={isSaving}
                          onClick={() => {
                            setEditingPdfSubjectId(subject.id);
                            setPdfSubjectEditDrafts((current) => ({
                              ...current,
                              [subject.id]: subject.name,
                            }));
                          }}
                          title={`Edit ${subject.name}`}
                          type="button"
                        >
                          <Pencil size={15} aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </>
                  )}
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
              {activeSection === "pdf"
                ? "Resources"
                : activeSection === "admins"
                  ? "Admins"
                : activeSection === "students"
                  ? "Users"
                  : "Permissions"}
            </p>
            <h1>
              {activeSection === "pdf"
                ? "PDF library"
                : activeSection === "admins"
                  ? "Registered admins"
                : activeSection === "students"
                  ? "Registered students"
                  : `Welcome ${currentAdminName}`}
            </h1>
          </div>
        </header>

        {activeSection === "admins" ? (
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="eyebrow">Admin access</p>
                <h2>Add admin login</h2>
              </div>
              <strong>{admins.length}</strong>
            </div>

            <form className="admin-student-form" onSubmit={handleAddAdmin}>
              <input
                value={adminDraft.fullName}
                onChange={(event) =>
                  setAdminDraft((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Admin name"
              />
              <input
                value={adminDraft.email}
                onChange={(event) =>
                  setAdminDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Admin email"
                type="email"
              />
              <input
                value={adminDraft.password}
                onChange={(event) =>
                  setAdminDraft((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Password"
                type="password"
              />
              <button type="submit" disabled={isSaving}>
                <UserPlus size={17} aria-hidden="true" />
                Add admin
              </button>
            </form>

            <div className="admin-student-summary">
              <Users size={18} aria-hidden="true" />
              <span>
                {admins.length} registered admin
                {admins.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="admin-student-list">
              {admins.map((admin) =>
                editingAdminEmail === admin.email ? (
                  <form
                    className="admin-student-edit-form"
                    key={admin.email}
                    onSubmit={(event) =>
                      void handleUpdateAdmin(event, admin.email)
                    }
                  >
                    <input
                      value={adminEditDrafts[admin.email]?.fullName ?? ""}
                      onChange={(event) =>
                        setAdminEditDrafts((current) => ({
                          ...current,
                          [admin.email]: {
                            email: current[admin.email]?.email ?? admin.email,
                            password: current[admin.email]?.password ?? "",
                            fullName: event.target.value,
                          },
                        }))
                      }
                      placeholder="Admin name"
                    />
                    <input
                      value={adminEditDrafts[admin.email]?.email ?? admin.email}
                      onChange={(event) =>
                        setAdminEditDrafts((current) => ({
                          ...current,
                          [admin.email]: {
                            email: event.target.value,
                            password: current[admin.email]?.password ?? "",
                            fullName:
                              current[admin.email]?.fullName ??
                              admin.fullName ??
                              "",
                          },
                        }))
                      }
                      placeholder="Admin email"
                      type="email"
                    />
                    <input
                      value={adminEditDrafts[admin.email]?.password ?? ""}
                      onChange={(event) =>
                        setAdminEditDrafts((current) => ({
                          ...current,
                          [admin.email]: {
                            email: current[admin.email]?.email ?? admin.email,
                            password: event.target.value,
                            fullName:
                              current[admin.email]?.fullName ??
                              admin.fullName ??
                              "",
                          },
                        }))
                      }
                      placeholder="New password (leave blank to keep)"
                      type="password"
                    />
                    <button type="submit" disabled={isSaving}>
                      <Check size={15} aria-hidden="true" />
                    </button>
                    <button
                      className="secondary"
                      type="button"
                      disabled={isSaving}
                      onClick={() => setEditingAdminEmail("")}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </form>
                ) : (
                  <div className="admin-student-row" key={admin.email}>
                    <div className="admin-student-identity">
                      <span>
                        <Users size={16} aria-hidden="true" />
                        {admin.fullName || "Admin"}
                      </span>
                      <small>{admin.email}</small>
                    </div>
                    <div className="admin-student-actions">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => startEditingAdmin(admin)}
                        title={`Edit ${admin.email}`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        className="danger"
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleDeleteAdmin(admin.email)}
                        title={`Delete ${admin.email}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ),
              )}

              {!admins.length && (
                <div className="admin-empty">
                  <Users size={24} aria-hidden="true" />
                  <strong>No registered admins yet</strong>
                </div>
              )}
            </div>
          </div>
        ) : activeSection === "students" ? (
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="eyebrow">Student access</p>
                <h2>Add student login</h2>
              </div>
              <strong>{students.length}</strong>
            </div>

            <form className="admin-student-form" onSubmit={handleAddStudent}>
              <input
                value={studentDraft.fullName}
                onChange={(event) =>
                  setStudentDraft((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Student name"
              />
              <input
                value={studentDraft.email}
                onChange={(event) =>
                  setStudentDraft((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Student email"
                type="email"
              />
              <input
                value={studentDraft.password}
                onChange={(event) =>
                  setStudentDraft((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Password"
                type="password"
              />
              <button type="submit" disabled={isSaving}>
                <UserPlus size={17} aria-hidden="true" />
                Add student
              </button>
            </form>

            <div className="admin-student-summary">
              <Users size={18} aria-hidden="true" />
              <span>
                {students.length} registered student
                {students.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="admin-student-list">
              {students.map((student) =>
                editingStudentEmail === student.email ? (
                  <form
                    className="admin-student-edit-form"
                    key={student.email}
                    onSubmit={(event) =>
                      void handleUpdateStudent(event, student.email)
                    }
                  >
                    <input
                      value={
                        studentEditDrafts[student.email]?.fullName ?? ""
                      }
                      onChange={(event) =>
                        setStudentEditDrafts((current) => ({
                          ...current,
                          [student.email]: {
                            email:
                              current[student.email]?.email ?? student.email,
                            password:
                              current[student.email]?.password ?? "",
                            fullName: event.target.value,
                          },
                        }))
                      }
                      placeholder="Student name"
                    />
                    <input
                      value={
                        studentEditDrafts[student.email]?.email ??
                        student.email
                      }
                      onChange={(event) =>
                        setStudentEditDrafts((current) => ({
                          ...current,
                          [student.email]: {
                            email: event.target.value,
                            password:
                              current[student.email]?.password ?? "",
                            fullName:
                              current[student.email]?.fullName ??
                              student.fullName ??
                              "",
                          },
                        }))
                      }
                      placeholder="Student email"
                      type="email"
                    />
                    <input
                      value={
                        studentEditDrafts[student.email]?.password ?? ""
                      }
                      onChange={(event) =>
                        setStudentEditDrafts((current) => ({
                          ...current,
                          [student.email]: {
                            email:
                              current[student.email]?.email ?? student.email,
                            password: event.target.value,
                            fullName:
                              current[student.email]?.fullName ??
                              student.fullName ??
                              "",
                          },
                        }))
                      }
                      placeholder="New password (leave blank to keep)"
                      type="password"
                    />
                    <button type="submit" disabled={isSaving}>
                      <Check size={15} aria-hidden="true" />
                    </button>
                    <button
                      className="secondary"
                      type="button"
                      disabled={isSaving}
                      onClick={() => setEditingStudentEmail("")}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </form>
                ) : (
                  <div className="admin-student-row" key={student.email}>
                    <div className="admin-student-identity">
                      <span>
                        <Users size={16} aria-hidden="true" />
                        {student.fullName || "Student"}
                      </span>
                      <small>{student.email}</small>
                    </div>
                    <div className="admin-student-actions">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => startEditingStudent(student)}
                        title={`Edit ${student.email}`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        className="danger"
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleDeleteStudent(student.email)}
                        title={`Delete ${student.email}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ),
              )}

              {!students.length && (
                <div className="admin-empty">
                  <Users size={24} aria-hidden="true" />
                  <strong>No registered students yet</strong>
                </div>
              )}
            </div>
          </div>
        ) : activeSection === "pdf" ? (
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
              {(selectedSubject.units ?? []).map((unit) => {
                const isUnitOpen = isAdminUnitOpen(unit.id);

                return (
                  <article className="admin-unit-card" key={unit.id}>
                    <button
                      className="admin-unit-heading"
                      type="button"
                      aria-expanded={isUnitOpen}
                      onClick={() => toggleAdminUnit(unit.id)}
                    >
                      <div>
                        <strong>{unit.title}</strong>
                        <span>
                          {getUnitTopics(unit).length} topics ·{" "}
                          {(unit.allowedEmails ?? []).length} unit students
                        </span>
                      </div>
                      {isUnitOpen ? (
                        <ChevronUp size={18} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={18} aria-hidden="true" />
                      )}
                    </button>

                    {isUnitOpen && (
                      <>
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
                          onSubmit={(event) =>
                            void handleAddTopic(event, unit.id)
                          }
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
                      const isTopicOpen = isAdminTopicOpen(topic.id);

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
                              <button
                                className="admin-topic-toggle"
                                type="button"
                                aria-expanded={isTopicOpen}
                                onClick={() => toggleAdminTopic(topic.id)}
                              >
                                <strong>{topic.title}</strong>
                                {isTopicOpen ? (
                                  <ChevronUp size={16} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={16} aria-hidden="true" />
                                )}
                              </button>
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

                          {isTopicOpen && (
                            <>
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
                            </>
                          )}
                        </div>
                      );
                    })}
                    {!getUnitTopics(unit).length && <em>No topics yet</em>}
                  </div>
                      </>
                    )}
                </article>
                );
              })}

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
