import { NextResponse } from "next/server";
import { addTopicSubtopic } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
    unitId: string;
    topicId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { subjectId, unitId, topicId } = await context.params;
  const body = (await request.json()) as { title?: string; driveUrl?: string };
  const subjects = await addTopicSubtopic(subjectId, unitId, topicId, body.title ?? "", body.driveUrl ?? "");

  return NextResponse.json({ subjects });
}
