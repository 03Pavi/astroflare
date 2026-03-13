import { NextRequest, NextResponse } from "next/server";
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chartId: string }> }
) {
  try {
    ensureConfig();
    const { chartId } = await params;
    const body = await req.json();

    const doc = await serverDatabases.updateDocument(DB_ID!, CHARTS_ID!, chartId, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ chartId: string }> }
) {
  try {
    ensureConfig();
    const { chartId } = await params;
    await serverDatabases.deleteDocument(DB_ID!, CHARTS_ID!, chartId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
