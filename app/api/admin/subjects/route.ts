import { NextResponse } from "next/server";
import { addSubject, getAdminSubjects } from "@/lib/server/admin-store";

export async function GET() {
  try {
    const subjects = await getAdminSubjects();
    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const subjects = await addSubject(body.name ?? "");

    return NextResponse.json({ subjects });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
