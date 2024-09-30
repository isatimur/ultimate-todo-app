import { Hono } from "hono";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = new Hono().post(async (c) => {
    const { taskDescription } = await c.req.json();

    if (!taskDescription) {
        return c.json({ error: "No task description provided" }, 400);
    }

    try {
        const prompt = `
      Break down the following task into subtasks:

      Task: "${taskDescription}"

      Subtasks:
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

        const subtasksText = response.choices[0].message?.content?.trim();

        const subtasks = subtasksText
            ? subtasksText
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((title, index) => ({
                    id: Date.now() + index,
                    title: title.replace(/^\d+\.\s*/, "").trim(),
                    completed: false,
                }))
            : [];

        return c.json({ subtasks });
    } catch (error) {
        console.error("Error generating subtasks:", error);
        return c.json({ error: "Failed to generate subtasks" }, 500);
    }
});

export default app;
