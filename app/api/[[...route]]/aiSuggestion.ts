import { Hono } from "hono";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = new Hono();
app.post(async (c) => {
  const { tasks } = await c.req.json();

  if (!tasks) {
    return c.json({ error: "No tasks provided" }, 400);
  }

  try {
    const prompt = `
      Analyze the following tasks and provide a suggestion to improve productivity.

      Tasks: ${JSON.stringify(tasks)}

      Suggestion:
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that breaks down tasks into subtasks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const suggestion = response.choices[0].message?.content?.trim();
    return c.json({ suggestion });
  } catch (error) {
    console.error("Error generating AI suggestion:", error);
    return c.json({ error: "Failed to generate suggestion" }, 500);
  }
});

export default app;
