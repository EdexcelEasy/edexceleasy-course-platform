import { NextResponse } from "next/server";
import { removePdfResource } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    pdfId: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { pdfId } = await context.params;
    const pdfs = await removePdfResource(pdfId);

    return NextResponse.json({ pdfs });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
