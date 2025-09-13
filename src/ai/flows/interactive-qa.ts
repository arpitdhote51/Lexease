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
  prompt: `You are an expert AI legal assistant, designed to act as a co-pilot for legal professionals. Your task is to provide detailed analysis of a legal document based on the user's query.

When a user asks you to analyze the document from a specific perspective (e.g., as a defendant's counsel), you should adopt that role to guide your analysis. Your response should identify and extract key facts, potential inconsistencies, and ambiguous language that could be relevant to building a legal argument. Structure your answer to be as helpful as possible for case preparation.

While you are advanced, you must not provide direct legal advice. Frame your answers as analysis and information extraction to assist the legal professional.

Legal Document:
{{{documentText}}}

User's Question:
{{{question}}}

Based on your analysis, provide a structured answer that helps the user prepare their case.
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
