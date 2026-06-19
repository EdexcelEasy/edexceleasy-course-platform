import { NextResponse } from "next/server";
import {
  addRegisteredAdmin,
  addRegisteredStudent,
  getRegisteredAdmins,
  getRegisteredStudents,
  removeRegisteredAdmin,
  removeRegisteredStudent,
  updateRegisteredAdmin,
  updateRegisteredStudent
} from "@/lib/server/admin-store";

export async function GET() {
  try {
    const [students, admins] = await Promise.all([getRegisteredStudents(), getRegisteredAdmins()]);

    return NextResponse.json({ students, admins });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: "admin" | "student";
    };
    const users =
      body.role === "admin"
        ? await addRegisteredAdmin(body.email ?? "", body.password ?? "", body.fullName ?? "")
        : await addRegisteredStudent(body.email ?? "", body.password ?? "", body.fullName ?? "");

    return NextResponse.json(body.role === "admin" ? { admins: users } : { students: users });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      currentEmail?: string;
      email?: string;
      password?: string;
      fullName?: string;
      role?: "admin" | "student";
    };
    const users =
      body.role === "admin"
        ? await updateRegisteredAdmin(body.currentEmail ?? "", body.email ?? "", body.fullName ?? "", body.password ?? "")
        : await updateRegisteredStudent(body.currentEmail ?? "", body.email ?? "", body.fullName ?? "", body.password ?? "");

    return NextResponse.json(body.role === "admin" ? { admins: users } : { students: users });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; role?: "admin" | "student" };
    const users = body.role === "admin" ? await removeRegisteredAdmin(body.email ?? "") : await removeRegisteredStudent(body.email ?? "");

    return NextResponse.json(body.role === "admin" ? { admins: users } : { students: users });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}
