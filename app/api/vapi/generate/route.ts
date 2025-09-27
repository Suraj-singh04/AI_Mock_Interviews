import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { conversation, userId } = await request.json();
    if (!conversation || !userId)
      return Response.json(
        { success: false, error: "Missing conversation or userId" },
        { status: 400 }
      );

    const { text: output } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `You are an expert interview assistant.
Here is a transcript of a conversation between a bot and a candidate:

${conversation}

From this transcript, extract the candidate's answers and:

1. Interpret into structured values:
   - Role (e.g., frontend developer)
   - Type (technical, behavioral, mixed)
   - Tech stack (list)
   - Level (beginner, intermediate, advanced)
   - Amount (number of questions, default 5)
2. Generate exactly that many interview questions.

Return strictly JSON (no markdown):
{
  "interpreted": {
    "role": "...",
    "type": "...",
    "level": "...",
    "techstack": ["...", "..."],
    "amount": 5
  },
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
}`,
    });

    // Clean AI output
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}") + 1;
    const parsed = JSON.parse(output.slice(jsonStart, jsonEnd));

    const interview = {
      ...parsed.interpreted,
      questions: parsed.questions,
      userId,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    return Response.json(
      { success: true, interviewId: docRef.id },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
