'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying key entities in a legal document.
 *
 * It includes:
 * - `identifyKeyEntities`: The main function to trigger the flow.
 * - `KeyEntityRecognitionInput`: The input type for the flow, defining the document content.
 * - `KeyEntityRecognitionOutput`: The output type for the flow, listing identified entities.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KeyEntityRecognitionInputSchema = z.object({
  documentText: z.string().describe('The text of the document to analyze.'),
});
export type KeyEntityRecognitionInput = z.infer<
  typeof KeyEntityRecognitionInputSchema
>;

const KeyEntitySchema = z.object({
  type: z
    .string()
    .describe('The type of entity (e.g., party, date, location).'),
  value: z.string().describe('The actual text of the entity.'),
});
export type KeyEntity = z.infer<typeof KeyEntitySchema>;

const KeyEntityRecognitionOutputSchema = z.object({
  entities: z
    .array(KeyEntitySchema)
    .describe('A list of key entities identified in the document.'),
});
export type KeyEntityRecognitionOutput = z.infer<
  typeof KeyEntityRecognitionOutputSchema
>;

export async function keyEntityRecognition(
  input: KeyEntityRecognitionInput
): Promise<KeyEntityRecognitionOutput> {
  return keyEntityRecognitionFlow(input);
}

const keyEntityRecognitionPrompt = ai.definePrompt({
  name: 'keyEntityRecognitionPrompt',
  input: {schema: KeyEntityRecognitionInputSchema},
  output: {schema: KeyEntityRecognitionOutputSchema},
  prompt: `You are an AI assistant specializing in legal document analysis.
  Your task is to identify and extract key entities from the following legal document.
  The entities should include parties involved, dates, locations, and other relevant information.

  Document:
  {{{documentText}}}

  Please provide the output in the structured JSON format.
`,
});

const keyEntityRecognitionFlow = ai.defineFlow(
  {
    name: 'keyEntityRecognitionFlow',
    inputSchema: KeyEntityRecognitionInputSchema,
    outputSchema: KeyEntityRecognitionOutputSchema,
  },
  async input => {
    const {output} = await keyEntityRecognitionPrompt(input);
    return output!;
  }
);
