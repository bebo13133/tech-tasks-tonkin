// POST /api/ask-mentor — приема въпрос (+ опционален контекст), връща отговор от Claude.

import { NextRequest, NextResponse } from "next/server";
import { askMentor, type UserContext } from "@/lib/mentor";
import { checkRateLimit } from "@/lib/rateLimit";

type AskMentorBody = {
  question?: unknown;
  user_context?: UserContext;
};

export async function POST(req: NextRequest) {
  // Rate limit: 10 заявки/мин/IP.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Твърде много заявки. Опитай отново след малко." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let body: AskMentorBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Невалиден JSON в тялото на заявката." },
      { status: 400 }
    );
  }

  const question = body?.question;
  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json(
      { error: "Полето 'question' е задължително и трябва да е непразен текст." },
      { status: 400 }
    );
  }
  if (question.length > 4000) {
    return NextResponse.json(
      { error: "Въпросът е твърде дълъг (макс. 4000 символа)." },
      { status: 400 }
    );
  }

  const userContext = body?.user_context;

  try {
    const answer = await askMentor(question, userContext);
    // Мониторинг лог — без лични данни (user_context умишлено не се логва).
    console.log("[ask-mentor]", JSON.stringify({ question, answerLength: answer.length }));
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[ask-mentor] Claude API error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Грешка при връзката с Claude API." },
      { status: 502 }
    );
  }
}
