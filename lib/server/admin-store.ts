import {
  subjectsSeed,
  type CourseSubtopic,
  type CourseTopic,
  type CourseUnit,
  type PdfResource,
  type PdfSubject,
  type Subject
} from "@/lib/lessons";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type SubjectRow = {
  id: string;
  name: string;
  color: string;
  display_order: number;
};

type SubjectTopicRow = {
  subject_id: string;
  title: string;
  display_order: number;
};

type UnitRow = {
  id: string;
  subject_id: string;
  title: string;
  revision_note_count: number;
  display_order: number;
};

type TopicRow = {
  id: string;
  unit_id: string;
  title: string;
  display_order: number;
};

type SubtopicRow = {
  id: string;
  topic_id: string;
  title: string;
  drive_url: string;
  display_order: number;
};

type PdfResourceRow = {
  id: string;
  title: string;
  drive_url: string;
  pdf_subject_id?: string | null;
  display_order: number;
};

type PdfSubjectRow = {
  id: string;
  name: string;
  display_order: number;
};

type AccessRow = {
  email: string;
};

type StoreSnapshot = {
  subjects: SubjectRow[];
  subjectTopics: SubjectTopicRow[];
  units: UnitRow[];
  unitAccess: Record<string, string[]>;
  topics: TopicRow[];
  subtopics: SubtopicRow[];
};

let supabaseClient: ReturnType<typeof createSupabaseAdminClient> | null = null;
let seedDataPromise: Promise<void> | null = null;

function getSupabase() {
  supabaseClient ??= createSupabaseAdminClient();
  return supabaseClient;
}

export async function getAdminSubjects() {
  await ensureSeedDataOnce();
  const snapshot = await readStore();

  return buildSubjects(snapshot);
}

export async function getPdfResources() {
  const [pdfs, pdfSubjects] = await Promise.all([
    runQuery(getSupabase().from("admin_pdfs").select("*").order("display_order", { ascending: true })),
    runOptionalQuery(getSupabase().from("admin_pdf_subjects").select("*").order("display_order", { ascending: true }))
  ]);
  const pdfAccess = await runOptionalQuery(
    getSupabase().from("admin_pdf_access").select("pdf_id,email").order("email", { ascending: true })
  );
  const accessByPdf = groupAccessByOwner(pdfAccess.data ?? [], "pdf_id");
  const subjectNames = new Map(((pdfSubjects.data ?? []) as PdfSubjectRow[]).map((subject) => [subject.id, subject.name]));

  return ((pdfs.data ?? []) as PdfResourceRow[]).map((row) =>
    buildPdfResource(row, accessByPdf[row.id] ?? [], row.pdf_subject_id ? subjectNames.get(row.pdf_subject_id) : undefined)
  );
}

export async function getPdfSubjects() {
  const result = await runOptionalQuery(
    getSupabase().from("admin_pdf_subjects").select("*").order("display_order", { ascending: true })
  );

  return ((result.data ?? []) as PdfSubjectRow[]).map(buildPdfSubject);
}

export async function addPdfSubject(name: string) {
  const trimmedName = name.trim();
  const id = slugify(trimmedName);

  if (!trimmedName) return getPdfSubjects();

  const existingSubjects = await getPdfSubjects();
  if (existingSubjects.some((subject) => subject.id === id)) return existingSubjects;

  await runQuery(
    getSupabase().from("admin_pdf_subjects").insert({
      id,
      name: trimmedName,
      display_order: existingSubjects.length
    })
  );

  return getPdfSubjects();
}

export async function addPdfResource(title: string, driveUrl: string, pdfSubjectId: string) {
  const trimmedTitle = title.trim();
  const trimmedDriveUrl = driveUrl.trim();
  const trimmedPdfSubjectId = pdfSubjectId.trim();

  if (!trimmedTitle || !trimmedDriveUrl || !trimmedPdfSubjectId) return getPdfResources();

  const pdfCount = await countRows("admin_pdfs");

  await runQuery(
    getSupabase().from("admin_pdfs").insert({
      id: `${slugify(trimmedTitle)}-${Date.now()}`,
      title: trimmedTitle,
      drive_url: trimmedDriveUrl,
      pdf_subject_id: trimmedPdfSubjectId,
      display_order: pdfCount
    })
  );

  return getPdfResources();
}

export async function removePdfResource(pdfId: string) {
  await runQuery(getSupabase().from("admin_pdfs").delete().eq("id", pdfId));

  return getPdfResources();
}

export async function addPdfAccess(pdfId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return getPdfResources();

  await runQuery(
    getSupabase().from("admin_pdf_access").upsert(
      {
        pdf_id: pdfId,
        email: normalizedEmail
      },
      { onConflict: "pdf_id,email" }
    )
  );

  return getPdfResources();
}

export async function removePdfAccess(pdfId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);

  await runQuery(getSupabase().from("admin_pdf_access").delete().eq("pdf_id", pdfId).eq("email", normalizedEmail));

  return getPdfResources();
}

export async function addSubject(name: string) {
  const trimmedName = name.trim();
  const id = slugify(trimmedName);

  if (!trimmedName) return getAdminSubjects();

  const existingSubjects = await getAdminSubjects();
  if (existingSubjects.some((subject) => subject.id === id)) return existingSubjects;

  await runQuery(
    getSupabase().from("admin_subjects").insert({
      id,
      name: trimmedName,
      color: pickSubjectColor(existingSubjects.length),
      display_order: existingSubjects.length
    })
  );

  return getAdminSubjects();
}

export async function removeSubject(subjectId: string) {
  await runQuery(getSupabase().from("admin_subjects").delete().eq("id", subjectId));

  return getAdminSubjects();
}

export async function addUnitAccess(subjectId: string, unitId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return getAdminSubjects();

  await ensureSubject(subjectId);
  await runQuery(
    getSupabase().from("admin_unit_access").upsert(
      {
        unit_id: unitId,
        email: normalizedEmail
      },
      { onConflict: "unit_id,email" }
    )
  );

  return getAdminSubjects();
}

export async function removeUnitAccess(subjectId: string, unitId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);

  await runQuery(getSupabase().from("admin_unit_access").delete().eq("unit_id", unitId).eq("email", normalizedEmail));

  return getAdminSubjects();
}

export async function addSubjectUnit(subjectId: string, title: string) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) return getAdminSubjects();

  await ensureSubject(subjectId);
  const unitCount = await countRows("admin_units", "subject_id", subjectId);

  await runQuery(
    getSupabase().from("admin_units").insert({
      id: `${subjectId}-${slugify(trimmedTitle)}-${Date.now()}`,
      subject_id: subjectId,
      title: trimmedTitle,
      revision_note_count: 0,
      display_order: unitCount
    })
  );

  return getAdminSubjects();
}

export async function addUnitTopic(subjectId: string, unitId: string, topic: string) {
  const trimmedTopic = topic.trim();

  if (!trimmedTopic) return getAdminSubjects();

  await ensureSubject(subjectId);
  const existing = await runQuery(
    getSupabase().from("admin_topics").select("id").eq("unit_id", unitId).eq("title", trimmedTopic).maybeSingle()
  );

  if (!existing.data) {
    const topicCount = await countRows("admin_topics", "unit_id", unitId);

    await runQuery(
      getSupabase().from("admin_topics").insert({
        id: `${unitId}-${slugify(trimmedTopic)}-${Date.now()}`,
        unit_id: unitId,
        title: trimmedTopic,
        display_order: topicCount
      })
    );
  }

  await upsertSubjectTopic(subjectId, trimmedTopic);

  return getAdminSubjects();
}

export async function updateUnitTopic(subjectId: string, unitId: string, topicId: string, title: string) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) return getAdminSubjects();

  const previous = await runQuery(
    getSupabase().from("admin_topics").select("title").eq("id", topicId).eq("unit_id", unitId).maybeSingle()
  );

  await runQuery(getSupabase().from("admin_topics").update({ title: trimmedTitle }).eq("id", topicId).eq("unit_id", unitId));

  if (previous.data?.title) {
    await runQuery(
      getSupabase()
        .from("admin_subject_topics")
        .update({ title: trimmedTitle })
        .eq("subject_id", subjectId)
        .eq("title", previous.data.title)
    );
  } else {
    await upsertSubjectTopic(subjectId, trimmedTitle);
  }

  return getAdminSubjects();
}

export async function addTopicSubtopic(
  subjectId: string,
  unitId: string,
  topicId: string,
  title: string,
  driveUrl: string
) {
  const trimmedTitle = title.trim();
  const trimmedDriveUrl = driveUrl.trim();

  if (!trimmedTitle || !trimmedDriveUrl) return getAdminSubjects();

  const subtopicCount = await countRows("admin_subtopics", "topic_id", topicId);

  await runQuery(
    getSupabase().from("admin_subtopics").insert({
      id: `${topicId}-${slugify(trimmedTitle)}-${Date.now()}`,
      topic_id: topicId,
      title: trimmedTitle,
      drive_url: trimmedDriveUrl,
      display_order: subtopicCount
    })
  );

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
  const trimmedTitle = title.trim();
  const trimmedDriveUrl = driveUrl.trim();

  if (!trimmedTitle || !trimmedDriveUrl) return getAdminSubjects();

  await runQuery(
    getSupabase()
      .from("admin_subtopics")
      .update({
        title: trimmedTitle,
        drive_url: trimmedDriveUrl
      })
      .eq("id", subtopicId)
      .eq("topic_id", topicId)
  );

  return getAdminSubjects();
}

export async function removeTopicSubtopic(subjectId: string, unitId: string, topicId: string, subtopicId: string) {
  await runQuery(getSupabase().from("admin_subtopics").delete().eq("id", subtopicId).eq("topic_id", topicId));

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

async function ensureSeedData() {
  const subjectRows = subjectsSeed.map((subject, subjectIndex) => ({
    id: subject.id,
    name: subject.name,
    color: subject.color,
    display_order: subjectIndex
  }));

  const subjectTopicRows = subjectsSeed.flatMap((subject) =>
    subject.topics.map((topic, topicIndex) => ({
      subject_id: subject.id,
      title: topic,
      display_order: topicIndex
    }))
  );

  const unitRows = subjectsSeed.flatMap((subject) =>
    (subject.units ?? []).map((unit, unitIndex) => ({
      id: unit.id,
      subject_id: subject.id,
      title: unit.title,
      revision_note_count: unit.revisionNoteCount,
      display_order: unitIndex
    }))
  );

  const topicRows = subjectsSeed.flatMap((subject) =>
    (subject.units ?? []).flatMap((unit) =>
      getUnitTopicItems(unit).map((topic, topicIndex) => ({
        id: topic.id,
        unit_id: unit.id,
        title: topic.title,
        display_order: topicIndex
      }))
    )
  );

  await runQuery(
    getSupabase().from("admin_subjects").upsert(subjectRows, { onConflict: "id", ignoreDuplicates: true })
  );

  await Promise.all([
    subjectTopicRows.length
      ? runQuery(
          getSupabase()
            .from("admin_subject_topics")
            .upsert(subjectTopicRows, { onConflict: "subject_id,title", ignoreDuplicates: true })
        )
      : Promise.resolve(null),
    unitRows.length
      ? runQuery(getSupabase().from("admin_units").upsert(unitRows, { onConflict: "id", ignoreDuplicates: true }))
      : Promise.resolve(null),
    topicRows.length
      ? runQuery(getSupabase().from("admin_topics").upsert(topicRows, { onConflict: "id", ignoreDuplicates: true }))
      : Promise.resolve(null)
  ]);
}

async function ensureSeedDataOnce() {
  seedDataPromise ??= ensureSeedData().catch((error) => {
    seedDataPromise = null;
    throw error;
  });

  await seedDataPromise;
}

async function ensureSubject(subjectId: string) {
  const existing = await runQuery(getSupabase().from("admin_subjects").select("id").eq("id", subjectId).maybeSingle());
  if (existing.data) return;

  const seedSubject = subjectsSeed.find((subject) => subject.id === subjectId);
  const subjectCount = await countRows("admin_subjects");

  await runQuery(
    getSupabase()
      .from("admin_subjects")
      .upsert(
        {
          id: subjectId,
          name: seedSubject?.name ?? subjectId,
          color: seedSubject?.color ?? pickSubjectColor(subjectCount),
          display_order: subjectCount
        },
        { onConflict: "id" }
      )
  );
}

async function upsertSubjectTopic(subjectId: string, title: string) {
  const topicCount = await countRows("admin_subject_topics", "subject_id", subjectId);

  await runQuery(
    getSupabase().from("admin_subject_topics").upsert(
      {
        subject_id: subjectId,
        title,
        display_order: topicCount
      },
      { onConflict: "subject_id,title", ignoreDuplicates: true }
    )
  );
}

async function readStore(): Promise<StoreSnapshot> {
  const [subjects, subjectTopics, units, unitAccess, topics, subtopics] = await Promise.all([
    runQuery(getSupabase().from("admin_subjects").select("*").order("display_order", { ascending: true })),
    runQuery(getSupabase().from("admin_subject_topics").select("*").order("display_order", { ascending: true })),
    runQuery(getSupabase().from("admin_units").select("*").order("display_order", { ascending: true })),
    runQuery(getSupabase().from("admin_unit_access").select("unit_id,email").order("email", { ascending: true })),
    runQuery(getSupabase().from("admin_topics").select("*").order("display_order", { ascending: true })),
    runQuery(getSupabase().from("admin_subtopics").select("*").order("display_order", { ascending: true }))
  ]);

  return {
    subjects: (subjects.data ?? []) as SubjectRow[],
    subjectTopics: (subjectTopics.data ?? []) as SubjectTopicRow[],
    units: (units.data ?? []) as UnitRow[],
    unitAccess: groupAccessByOwner(unitAccess.data ?? [], "unit_id"),
    topics: (topics.data ?? []) as TopicRow[],
    subtopics: (subtopics.data ?? []) as SubtopicRow[]
  };
}

function buildSubjects(snapshot: StoreSnapshot): Subject[] {
  return snapshot.subjects.map((subject) => {
    const units = snapshot.units
      .filter((unit) => unit.subject_id === subject.id)
      .map((unit) => buildUnit(unit, snapshot));

    const subjectTopics = snapshot.subjectTopics
      .filter((topic) => topic.subject_id === subject.id)
      .map((topic) => topic.title);

    return {
      id: subject.id,
      name: subject.name,
      color: subject.color,
      topics: subjectTopics.length ? subjectTopics : units.flatMap((unit) => unit.topics),
      allowedEmails: [],
      units
    };
  });
}

function buildUnit(unit: UnitRow, snapshot: StoreSnapshot): CourseUnit {
  const topicItems = snapshot.topics
    .filter((topic) => topic.unit_id === unit.id)
    .map((topic) => buildTopic(topic, snapshot));

  return {
    id: unit.id,
    title: unit.title,
    topicCount: topicItems.length,
    revisionNoteCount: unit.revision_note_count,
    topics: topicItems.map((topic) => topic.title),
    allowedEmails: snapshot.unitAccess[unit.id] ?? [],
    topicItems
  };
}

function buildTopic(topic: TopicRow, snapshot: StoreSnapshot): CourseTopic {
  return {
    id: topic.id,
    title: topic.title,
    subtopics: snapshot.subtopics
      .filter((subtopic) => subtopic.topic_id === topic.id)
      .map((subtopic): CourseSubtopic => ({
        id: subtopic.id,
        title: subtopic.title,
        driveUrl: subtopic.drive_url
      }))
  };
}

function buildPdfResource(row: PdfResourceRow, allowedEmails: string[], pdfSubjectName?: string): PdfResource {
  return {
    id: row.id,
    title: row.title,
    driveUrl: row.drive_url,
    pdfSubjectId: row.pdf_subject_id ?? null,
    pdfSubjectName: pdfSubjectName ?? "Unassigned",
    allowedEmails
  };
}

function buildPdfSubject(row: PdfSubjectRow): PdfSubject {
  return {
    id: row.id,
    name: row.name
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

function groupAccessByOwner(rows: unknown[], ownerKey: "unit_id" | "pdf_id") {
  return rows.reduce<Record<string, string[]>>((grouped, row) => {
    const accessRow = row as AccessRow & Record<typeof ownerKey, string>;
    grouped[accessRow[ownerKey]] = [...(grouped[accessRow[ownerKey]] ?? []), accessRow.email];
    return grouped;
  }, {});
}

async function countRows(table: keyof Database["public"]["Tables"], column?: string, value?: string) {
  let query = getSupabase().from(table).select("*", { count: "exact", head: true });

  if (column && value) {
    query = query.eq(column, value);
  }

  const result = await runQuery(query);
  return result.count ?? 0;
}

async function runQuery<T>(query: PromiseLike<{ data: T; error: { message: string } | null; count?: number | null }>) {
  const result = await query;

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

async function runOptionalQuery<T>(query: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const result = await query;

  if (result.error && !isMissingSchemaCacheTableError(result.error.message)) {
    throw new Error(result.error.message);
  }

  return result.error ? { data: null } : result;
}

function isMissingSchemaCacheTableError(message: string) {
  return message.includes("schema cache") && message.includes("Could not find the table");
}
