import { NextResponse } from "next/server";
import { addPdfSubject, getPdfSubjects } from "@/lib/server/admin-store";

export async function GET() {
  try {
    const pdfSubjects = await getPdfSubjects();
    return NextResponse.json({ pdfSubjects });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const pdfSubjects = await addPdfSubject(body.name ?? "");

    return NextResponse.json({ pdfSubjects });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
