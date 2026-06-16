import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const STRUCTURED_PROMPT = `You are a site operations assistant for Galaxy Home Automation.

The technician has submitted a voice report from a job site. Convert it into structured JSON.

Return ONLY valid JSON with no markdown, no explanation:
{
  "workCompleted": ["..."],
  "materialsUsed": ["..."],
  "pendingWork": ["..."],
  "issues": ["..."],
  "clientRequests": ["..."],
  "recommendedStatus": "Completed" | "Partially Completed" | "In Progress" | "Need Support" | "Need Materials"
}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const audioBytes = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBytes).toString("base64");

    // First: transcribe
    const transcribeResult = await model.generateContent([
      {
        inlineData: {
          mimeType: audioFile.type || "audio/webm",
          data: audioBase64,
        },
      },
      "Transcribe this audio recording exactly as spoken. Return only the transcript text.",
    ]);

    const transcript = transcribeResult.response.text().trim();

    // Second: structure the transcript
    const structureResult = await model.generateContent([
      STRUCTURED_PROMPT,
      `Technician report transcript:\n"${transcript}"`,
    ]);

    let rawJson = structureResult.response.text().trim();
    // Strip markdown code fences if present
    rawJson = rawJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    const generatedReport = JSON.parse(rawJson);

    return NextResponse.json({ transcript, generatedReport });
  } catch (err) {
    console.error("Voice report processing error:", err);
    return NextResponse.json({ error: "Failed to process voice report" }, { status: 500 });
  }
}
