import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { input } = req.body;

  if (!input) {
    res.status(400).json({ error: 'No input provided' });
    return;
  }

  try {
    const prompt = `
      Extract the task details from the following input and return a JSON object with keys: title, due_date, priority, tags.

      Input: "${input}"
    `;

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 150,
      temperature: 0,
    });

    const data = JSON.parse(response.data.choices[0].text.trim());
    res.status(200).json(data);
  } catch (error) {
    console.error('Error parsing task:', error);
    res.status(500).json({ error: 'Failed to parse task' });
  }
}
