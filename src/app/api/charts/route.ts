import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { serverDatabases } from "@/lib/appwrite-server";

const DB_ID = process.env.APPWRITE_DATABASE_ID;
const CHARTS_ID = process.env.APPWRITE_CHARTS_COLLECTION_ID;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function ensureConfig() {
  if (!DB_ID || !CHARTS_ID) {
    throw new Error(
      "Missing Appwrite DB env vars. Set APPWRITE_DATABASE_ID and APPWRITE_CHARTS_COLLECTION_ID."
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    ensureConfig();
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId query parameter" },
        { status: 400 }
      );
    }

    const data = await serverDatabases.listDocuments(DB_ID!, CHARTS_ID!, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
    ]);

    return NextResponse.json({ success: true, documents: data.documents });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureConfig();
    const body = await req.json();

    const now = new Date().toISOString();
    const doc = await serverDatabases.createDocument(DB_ID!, CHARTS_ID!, ID.unique(), {
      ...body,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
