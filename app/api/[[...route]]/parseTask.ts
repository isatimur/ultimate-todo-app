import { Hono } from "hono";
import { OpenAI } from "openai";

import { z } from "zod";

export const runtime = "edge";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the schema for request validation
const parseTaskSchema = z.object({
  input: z.string(),
});

// POST /parse
const app = new Hono().post("/", async (c) => {
  const body = await c.req.json();
  const parseResult = parseTaskSchema.safeParse(body);

  if (!parseResult.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const task = parseResult.data.input;

  try {
    const prompt = `
      Extract the task details from the following input and return a JSON object with keys: title, due_date, priority, tags.

      Input: "${task}"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that parse tasks into a structured format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const parsedText = response.choices[0].message?.content?.trim();
    const data = parsedText ? JSON.parse(parsedText) : {};

    return c.json(data, 200);
  } catch (error) {
    console.error("Error parsing task with OpenAI:", error);
    return c.json({ error: "Failed to parse task" }, 500);
  }
});

export default app;
