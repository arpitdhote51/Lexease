'use server';

/**
 * @fileOverview An AI agent for answering questions about a legal document.
 *
 * - interactiveQA - A function that handles the question answering process.
 * - InteractiveQAInput - The input type for the interactiveQA function.
 * - InteractiveQAOutput - The return type for the interactiveQA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractiveQAInputSchema = z.object({
  documentText: z.string().describe('The text content of the legal document.'),
  question: z.string().describe('The user question about the document.'),
});
export type InteractiveQAInput = z.infer<typeof InteractiveQAInputSchema>;

const InteractiveQAOutputSchema = z.object({
  answer: z
    .string()
    .describe(
      'The answer to the user question based on the document content.'
    ),
});
export type InteractiveQAOutput = z.infer<typeof InteractiveQAOutputSchema>;

export async function interactiveQA(
  input: InteractiveQAInput
): Promise<InteractiveQAOutput> {
  return interactiveQAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactiveQAPrompt',
  input: {schema: InteractiveQAInputSchema},
  output: {schema: InteractiveQAOutputSchema},
  prompt: `You are an AI assistant specialized in answering questions about legal documents.
  Based on the content of the following legal document, answer the user's question.

  Legal Document:
  {{{documentText}}}

  Question:
  {{{question}}}

  Answer:
  `,
});

const interactiveQAFlow = ai.defineFlow(
  {
    name: 'interactiveQAFlow',
    inputSchema: InteractiveQAInputSchema,
    outputSchema: InteractiveQAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
