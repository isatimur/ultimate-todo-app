import { Hono } from "hono";
import openai from "@/lib/openai";
import { NextResponse } from "next/server";

import { z } from "zod";

export const runtime = "edge";

// Define the schema for request validation
const parseTaskSchema = z.object({
  input: z.string(),
});

// POST /parse
const app = new Hono()
  .post("/", async (c) => {
    const body = await c.req.json();
    const parseResult = parseTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json({ error: "Invalid input" }, 400);
    }

    const task = parseResult.data.input;

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a task parser. Respond only with a JSON object containing title, due_date (YYYY-MM-DD format), priority (High/Medium/Low), and tags (array of strings). No markdown formatting or explanation.",
          },
          {
            role: "user",
            content: parseResult.data.input,
          },
        ],
        temperature: 0.3,
      });

      const parsedText = response.choices[0].message?.content?.trim() || "{}";


      try {
        const data = JSON.parse(parsedText);
        return NextResponse.json(data);
      } catch (parseError) {
        console.error("Invalid JSON from OpenAI:", parsedText);
        return NextResponse.json({
          title: parseResult.data.input,
          due_date: new Date().toISOString().split('T')[0],
          priority: "Medium",
          tags: []
        });
      }
    } catch (error) {
      console.error("Error parsing task with OpenAI:", error);
      return c.json({ error: "Failed to parse task" }, 500);
    }
  });

export default app;
