// Receives a problem report from the UI and files it in Bugzilla, forwarding any
// attachments to Bugzilla's attachment API.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createBug, addAttachment } from "@/app/lib/bugzilla";
import { ALLOWED_IMAGE_TYPES, ALLOWED_TEXT_EXTENSIONS, MAX_ATTACHMENTS } from "@/app/lib/attachmentUpload";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

// Base64 inflates ~33%. These ceilings mirror the client-side caps and keep the
// request body small enough for hosts that cap bodies around a few MB.
const MAX_IMAGE_B64_CHARS = 2_000_000; // ~1.5 MB raw
const MAX_TEXT_B64_CHARS = 1_400_000; // ~1 MB raw

interface IncomingAttachment {
  fileName?: unknown;
  contentType?: unknown;
  dataBase64?: unknown;
}

async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return Number(payload.userId);
  } catch {
    return null;
  }
}

function validateAttachments(raw: unknown):
  | { ok: true; attachments: { fileName: string; contentType: string; dataBase64: string }[] }
  | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, attachments: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: "Attachments must be an array." };
  }
  if (raw.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `At most ${MAX_ATTACHMENTS} attachments are allowed.` };
  }

  const attachments: { fileName: string; contentType: string; dataBase64: string }[] = [];

  for (const item of raw as IncomingAttachment[]) {
    const fileName = typeof item?.fileName === "string" ? item.fileName.trim() : "";
    const contentType = typeof item?.contentType === "string" ? item.contentType.trim() : "";
    const dataBase64 = typeof item?.dataBase64 === "string" ? item.dataBase64 : "";

    if (!fileName || !contentType || !dataBase64) {
      return { ok: false, error: "Each attachment needs a fileName, contentType, and dataBase64." };
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
    const lowerName = fileName.toLowerCase();
    const isText = ALLOWED_TEXT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isImage && !(isText && contentType === "text/plain")) {
      return { ok: false, error: `Unsupported attachment type: ${fileName}` };
    }

    const limit = isImage ? MAX_IMAGE_B64_CHARS : MAX_TEXT_B64_CHARS;
    if (dataBase64.length > limit) {
      return { ok: false, error: `Attachment "${fileName}" is too large.` };
    }

    attachments.push({ fileName, contentType, dataBase64 });
  }

  return { ok: true, attachments };
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { summary, description, attachments: rawAttachments } = await request.json();
    if (!summary?.trim()) {
      return NextResponse.json({ error: "Summary is required" }, { status: 400 });
    }

    const validated = validateAttachments(rawAttachments);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    // Create the bug first so attachments never block the report itself.
    const id = await createBug(summary.trim(), (description ?? "").trim() || "(no details)");

    const attachmentErrors: { fileName: string; error: string }[] = [];
    for (const attachment of validated.attachments) {
      try {
        await addAttachment(id, attachment);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload attachment";
        attachmentErrors.push({ fileName: attachment.fileName, error: message });
      }
    }

    return NextResponse.json({ id, attachmentErrors }, { status: 201 });
  } catch (error) {
    console.error("Failed to file bug:", error);
    const message = error instanceof Error ? error.message : "Failed to file bug";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}