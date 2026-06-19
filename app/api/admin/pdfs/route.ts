import { NextResponse } from "next/server";
import { addPdfResource, getPdfResources } from "@/lib/server/admin-store";

export async function GET() {
  try {
    const pdfs = await getPdfResources();
    return NextResponse.json({ pdfs });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { title?: string; driveUrl?: string };
    const pdfs = await addPdfResource(body.title ?? "", body.driveUrl ?? "");

    return NextResponse.json({ pdfs });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
