import { NextResponse } from "next/server";
import { removeSubject } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { subjectId } = await context.params;
    const subjects = await removeSubject(subjectId);

    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
