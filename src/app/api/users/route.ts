import { NextRequest, NextResponse } from "next/server";
import { serverDatabases } from "@/lib/appwrite-server";

const DB_ID = process.env.APPWRITE_DATABASE_ID;
const USERS_ID = process.env.APPWRITE_USERS_COLLECTION_ID;

type UpsertUserBody = {
  firebaseUid?: string;
  name?: string;
  email?: string;
  provider?: string;
  photoURL?: string;
};

function ensureConfig() {
  if (!DB_ID || !USERS_ID) {
    throw new Error(
      "Missing Appwrite users env vars. Set APPWRITE_DATABASE_ID and APPWRITE_USERS_COLLECTION_ID."
    );
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export async function POST(req: NextRequest) {
  try {
    ensureConfig();
    const body = (await req.json()) as UpsertUserBody;

    if (!body.firebaseUid) {
      return NextResponse.json(
        { success: false, message: "firebaseUid is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const payload = {
      firebaseUid: body.firebaseUid,
      name: body.name ?? "Unknown",
      email: body.email ?? "",
      provider: body.provider ?? "",
      photoURL: body.photoURL ?? "",
      updatedAt: now,
    };

    try {
      const created = await serverDatabases.createDocument(
        DB_ID!,
        USERS_ID!,
        body.firebaseUid,
        {
          ...payload,
          onboardingComplete: false,
          createdAt: now,
        }
      );
      return NextResponse.json({ success: true, document: created }, { status: 201 });
    } catch (error: any) {
      if (error?.code !== 409) {
        throw error;
      }

      const updated = await serverDatabases.updateDocument(
        DB_ID!,
        USERS_ID!,
        body.firebaseUid,
        payload
      );
      return NextResponse.json({ success: true, document: updated });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
