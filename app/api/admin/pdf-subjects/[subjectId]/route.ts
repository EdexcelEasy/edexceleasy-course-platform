import { NextResponse } from "next/server";
import { updatePdfSubject } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { subjectId } = await context.params;
    const body = (await request.json()) as { name?: string };
    const pdfSubjects = await updatePdfSubject(subjectId, body.name ?? "");

    return NextResponse.json({ pdfSubjects });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
