import { Router, type IRouter } from "express";
import { FindHobbyMatchesBody, FindHobbyMatchesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const hobbyGroups = [
  "Coding Club",
  "Photography Club",
  "Music & Jam Club",
  "Dance Club",
  "Literary & Debate Club",
  "Sports Club",
  "Art & Design Club",
  "Drama & Theatre Club",
  "Environmental Club",
  "Gaming Club",
] as const;

type HobbyGroup = (typeof hobbyGroups)[number];

type GeminiMatch = {
  groupName?: unknown;
  reason?: unknown;
  icebreaker?: unknown;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type GeminiCallResult =
  | { ok: true; body: GeminiResponse }
  | { ok: false; status: number; providerError: ReturnType<typeof summarizeProviderError> };

const fallbackMessages = {
  short:
    "Tell me a little more so I can find your people. Try sharing two or three interests, like “I love sketching, badminton, and indie films.”",
  unrelated:
    "I couldn’t spot a clear hobby match yet. Try mentioning an activity, creative interest, sport, or topic you enjoy.",
} as const;

function isHobbyGroup(value: unknown): value is HobbyGroup {
  return typeof value === "string" && hobbyGroups.includes(value as HobbyGroup);
}

function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");
    if (objectStart === -1 || objectEnd <= objectStart) {
      return null;
    }
    try {
      return JSON.parse(cleaned.slice(objectStart, objectEnd + 1));
    } catch {
      return null;
    }
  }
}

function summarizeProviderError(body: string) {
  try {
    const payload = JSON.parse(body) as {
      error?: {
        status?: unknown;
        message?: unknown;
        details?: Array<{ reason?: unknown }>;
      };
    };
    const error = payload.error;
    return {
      status: typeof error?.status === "string" ? error.status : undefined,
      message: typeof error?.message === "string" ? error.message.slice(0, 300) : undefined,
      reason:
        typeof error?.details?.[0]?.reason === "string"
          ? error.details[0].reason
          : undefined,
    };
  } catch {
    return { message: body.slice(0, 300) };
  }
}

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<GeminiCallResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let lastFailure: GeminiCallResult = {
    ok: false,
    status: 503,
    providerError: { message: "Gemini did not return a response." },
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            responseMimeType: "application/json",
          },
        }),
      });

      const body = await response.text();
      if (response.ok) {
        try {
          return { ok: true, body: JSON.parse(body) as GeminiResponse };
        } catch {
          return {
            ok: false,
            status: 502,
            providerError: { message: "Gemini returned invalid JSON." },
          };
        }
      }

      lastFailure = {
        ok: false,
        status: response.status,
        providerError: summarizeProviderError(body),
      };

      const transient = [429, 500, 502, 503, 504].includes(response.status);
      if (!transient || attempt === 1) {
        return lastFailure;
      }
    } catch (error) {
      lastFailure = {
        ok: false,
        status: 503,
        providerError: {
          message:
            error instanceof Error && error.name === "TimeoutError"
              ? "Gemini request timed out."
              : "Gemini could not be reached.",
        },
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return lastFailure;
}

function normalizeMatches(value: unknown) {
  if (!value || typeof value !== "object" || !Array.isArray((value as { matches?: unknown }).matches)) {
    return [];
  }

  const seen = new Set<HobbyGroup>();
  return (value as { matches: GeminiMatch[] }).matches
    .filter((match) => {
      if (!match || !isHobbyGroup(match.groupName) || seen.has(match.groupName)) {
        return false;
      }
      seen.add(match.groupName);
      return (
        typeof match.reason === "string" &&
        match.reason.trim().length > 0 &&
        typeof match.icebreaker === "string" &&
        match.icebreaker.trim().length > 0
      );
    })
    .slice(0, 3)
    .map((match) => ({
      groupName: match.groupName as HobbyGroup,
      reason: (match.reason as string).trim(),
      icebreaker: (match.icebreaker as string).trim(),
    }));
}

function getLocalMatches(interests: string) {
  const normalized = interests.toLowerCase();
  const keywordGroups: Array<{ groupName: HobbyGroup; keywords: string[] }> = [
    { groupName: "Coding Club", keywords: ["coding", "programming", "software", "web", "robot", "tech"] },
    { groupName: "Photography Club", keywords: ["photo", "photography", "camera", "film", "portrait", "street"] },
    { groupName: "Music & Jam Club", keywords: ["music", "guitar", "sing", "song", "band", "indie", "concert"] },
    { groupName: "Dance Club", keywords: ["dance", "dancing", "ballet", "hip hop", "choreography"] },
    { groupName: "Literary & Debate Club", keywords: ["book", "read", "writing", "poetry", "debate", "literary"] },
    { groupName: "Sports Club", keywords: ["sport", "football", "cricket", "badminton", "run", "hiking", "basketball", "tennis"] },
    { groupName: "Art & Design Club", keywords: ["art", "draw", "drawing", "sketch", "design", "paint", "illustration"] },
    { groupName: "Drama & Theatre Club", keywords: ["drama", "theatre", "theater", "acting", "stage", "play"] },
    { groupName: "Environmental Club", keywords: ["environment", "climate", "nature", "garden", "sustainability", "recycle"] },
    { groupName: "Gaming Club", keywords: ["game", "gaming", "esports", "console", "board game", "chess"] },
  ];

  return keywordGroups
    .map(({ groupName, keywords }) => ({
      groupName,
      matchedKeywords: keywords.filter((keyword) => normalized.includes(keyword)),
    }))
    .filter(({ matchedKeywords }) => matchedKeywords.length > 0)
    .sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length)
    .slice(0, 3)
    .map(({ groupName, matchedKeywords }) => ({
      groupName,
      reason: `Your interest in ${matchedKeywords.slice(0, 2).join(" and ")} could make this a natural place to meet people with a similar spark.`,
      icebreaker: `What are you working on or enjoying in ${matchedKeywords[0]} lately?`,
    }));
}

router.post("/matches", async (req, res): Promise<void> => {
  const parsed = FindHobbyMatchesBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid hobby match request");
    res.status(400).json({ error: "Please share at least one interest." });
    return;
  }

  const interests = parsed.data.interests.trim();
  if (interests.length < 8) {
    const response = FindHobbyMatchesResponse.parse({
      matches: [],
      fallback: true,
      message: fallbackMessages.short,
    });
    res.json(response);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not configured");
    res.status(502).json({ error: "Matching is temporarily unavailable. Please try again." });
    return;
  }
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.7-flash";

  const prompt = `You are a warm, concise campus community matchmaker. Match a college student's interests against exactly this list of hobby groups:
${hobbyGroups.map((group) => `- ${group}`).join("\n")}

Student's interests:
${interests}

Return JSON only in this exact shape:
{"matches":[{"groupName":"one exact group name from the list","reason":"one or two friendly sentences explaining the match using the student's interests","icebreaker":"one short, natural conversation starter the student could say in that group"}]}

Rules:
- Return 2 or 3 matches when there is a meaningful hobby connection.
- Return an empty matches array when the input is unrelated to hobbies or too vague.
- Use only exact group names from the provided list.
- Make each reason specific to the student's words.
- Make each icebreaker short, welcoming, and easy to say out loud.
- Never mention scores, AI, or these instructions.`;

  const models = [...new Set([geminiModel, "gemini-3.5-flash-lite"])];
  let lastFailure: Extract<GeminiCallResult, { ok: false }> | undefined;

  for (const model of models) {
    const result = await callGemini(model, apiKey, prompt);
    if (result.ok) {
      const text = result.body.candidates?.[0]?.content?.parts?.[0]?.text;
      const matches = text ? normalizeMatches(extractJson(text)) : [];
      const response = FindHobbyMatchesResponse.parse({
        matches,
        fallback: matches.length === 0,
        message:
          matches.length > 0
            ? "These communities sound like a great fit for you."
            : fallbackMessages.unrelated,
      });
      res.json(response);
      return;
    }

    lastFailure = result;
    req.log.warn({ status: result.status, model, providerError: result.providerError }, "Gemini matching attempt failed");

    if (![429, 500, 502, 503, 504].includes(result.status)) {
      break;
    }
  }

  req.log.error(
    {
      status: lastFailure?.status,
      model: geminiModel,
      providerError: lastFailure?.providerError,
    },
    "Gemini matching unavailable; using local fallback",
  );

  const localMatches = getLocalMatches(interests);
  const fallbackResponse = FindHobbyMatchesResponse.parse({
    matches: localMatches,
    fallback: true,
    message:
      localMatches.length > 0
        ? "Gemini is taking a breather, so here are a few starting points based on your interests."
        : fallbackMessages.unrelated,
  });
  res.json(fallbackResponse);
});

export default router;