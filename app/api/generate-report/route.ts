import { NextRequest, NextResponse } from "next/server";
import { generateVulnReport } from "@/lib/gemini";
import { rateLimit, getClientIP } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(`generate:${ip}`, 10, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { scanInput, scanType } = body as {
      scanInput: string;
      scanType: string;
    };

    if (
      !scanInput ||
      typeof scanInput !== "string" ||
      scanInput.trim().length < 10
    ) {
      return NextResponse.json(
        { error: "Scan input is required and must be at least 10 characters." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!scanType || typeof scanType !== "string") {
      return NextResponse.json(
        { error: "Scanner type is required." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const report = await generateVulnReport(scanInput.trim(), scanType.trim());

    return NextResponse.json(
      {
        report,
        generatedAt: new Date().toISOString(),
        scanType: scanType.trim(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[generate-report] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
