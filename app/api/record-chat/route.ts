import { buildRecordFallbackReply } from "@/lib/ai/buildRecordFallbackReply";
import { NextResponse } from "next/server";
import { buildRecordChatSystemInstruction, buildRecordContextBlock } from "@/lib/ai/buildRecordChatPrompt";
import type { RecordChatRequestBody, RecordChatResponseBody } from "@/lib/ai/types";

export const runtime = "nodejs";

const GEMINI_MODEL =
  process.env.GEMINI_RECORD_CHAT_MODEL ??
  process.env.GEMINI_CHAT_MODEL ??
  "gemini-2.5-flash";

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? null;
}

function extractReply(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    .candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();

  return text || null;
}

function isValidBody(value: unknown): value is RecordChatRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RecordChatRequestBody>;
  return (
    typeof candidate.recordId === "string" &&
    typeof candidate.latestUserMessage === "string" &&
    Array.isArray(candidate.chatHistory) &&
    !!candidate.recordContext &&
    typeof candidate.recordContext === "object"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid record chat request." }, { status: 400 });
  }

  const latestUserMessage = body.latestUserMessage.trim();
  if (!latestUserMessage) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }

  const fallbackReply = buildRecordFallbackReply(latestUserMessage, body.recordContext);
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json<RecordChatResponseBody>({
      reply: fallbackReply,
      model: "local-record-fallback",
      source: "fallback",
    });
  }

  const systemInstruction = buildRecordChatSystemInstruction();
  const contextBlock = buildRecordContextBlock(body.recordContext);

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            ...body.chatHistory.slice(-12).map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
            {
              role: "user",
              parts: [
                {
                  text: `Record context:\n${contextBlock}\n\nUser question:\n${latestUserMessage}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            topP: 0.9,
            maxOutputTokens: 700,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      return NextResponse.json<RecordChatResponseBody>({
        reply: fallbackReply,
        model: "local-record-fallback",
        source: "fallback",
      });
    }

    const payload = (await geminiResponse.json()) as unknown;
    const reply = extractReply(payload);

    if (!reply) {
      return NextResponse.json<RecordChatResponseBody>({
        reply: fallbackReply,
        model: "local-record-fallback",
        source: "fallback",
      });
    }

    const response: RecordChatResponseBody = {
      reply,
      model: GEMINI_MODEL,
      source: "gemini",
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json<RecordChatResponseBody>({
      reply: fallbackReply,
      model: "local-record-fallback",
      source: "fallback",
    });
  }
}
