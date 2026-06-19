import { NextResponse } from "next/server";
import { addPdfAccess, removePdfAccess } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    pdfId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { pdfId } = await context.params;
    const body = (await request.json()) as { email?: string };
    const pdfs = await addPdfAccess(pdfId, body.email ?? "");

    return NextResponse.json({ pdfs });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { pdfId } = await context.params;
    const body = (await request.json()) as { email?: string };
    const pdfs = await removePdfAccess(pdfId, body.email ?? "");

    return NextResponse.json({ pdfs });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
