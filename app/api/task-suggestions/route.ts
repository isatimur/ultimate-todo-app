import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestSchema = z.object({
  input: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input } = requestSchema.parse(body);

    const prompt = `Given the task title or description: "${input}"
    Please analyze it and provide 3 task suggestions with the following details:
    - A clear, actionable title
    - Appropriate priority (Low, Medium, High)
    - Due date (relative to current date)
    - Any relevant tags
    - A brief description
    
    Format each suggestion as a JSON object.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful task management assistant that helps break down and enhance task descriptions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const suggestions = JSON.parse(response.choices[0].message.content || "{}");

    // Validate and format suggestions
    const formattedSuggestions = suggestions.suggestions.map((suggestion: any) => ({
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority as TaskPriority,
      due_date: suggestion.due_date,
      tags: suggestion.tags || [],
      status: 'To Do' as TaskStatus
    }));

    return NextResponse.json({
      success: true,
      suggestions: formattedSuggestions
    });
  } catch (error) {
    console.error('Error generating task suggestions:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 