type GroqChatMessage = {
  role: "system" | "user";
  content: string;
};

export async function callGroqJson<T>({
  messages,
  model = "llama-3.1-8b-instant",
  temperature = 0.35,
  timeoutMs = 12000
}: {
  messages: GroqChatMessage[];
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq request failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq response was empty.");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Groq response did not contain JSON.");
    }

    return JSON.parse(jsonMatch[0]) as T;
  } finally {
    clearTimeout(timeout);
  }
}
