import { NextResponse } from "next/server";
import { addSubject, getAdminSubjects } from "@/lib/server/admin-store";

export async function GET() {
  const subjects = await getAdminSubjects();
  return NextResponse.json({ subjects });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  const subjects = await addSubject(body.name ?? "");

  return NextResponse.json({ subjects });
}
