// Receives a problem report from the UI and files it in Bugzilla
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createBug } from "@/app/lib/bugzilla";
import { checkBugReportRateLimit, recordBugReportAttempt, formatLockTime } from "@/app/lib/bugReportRateLimit";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

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

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { summary, description } = await request.json();
    if (!summary?.trim()) {
      return NextResponse.json({ error: "Summary is required" }, { status: 400 });
    }

    // Check rate limit
    const rateLimit = await checkBugReportRateLimit(userId);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.remainingTime ? Math.ceil(rateLimit.remainingTime / 1000) : 3600;
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Try again in ${formatLockTime(rateLimit.remainingTime || 3600000)}.`,
          retryAfter,
        },
        { status: 429 }
      );
    }

    // Record the attempt
    await recordBugReportAttempt(userId);

    const id = await createBug(summary.trim(), (description ?? "").trim() || "(no details)");
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Failed to file bug:", error);
    const message = error instanceof Error ? error.message : "Failed to file bug";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}