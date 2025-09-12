
'use server';

/**
 * @fileOverview A Genkit flow that recognizes key entities in a legal document.
 *
 * - keyEntityRecognition - A function that takes legal document text and returns a list of key entities.
 * - KeyEntityRecognitionInput - The input type for the keyEntityRecognition function.
 * - KeyEntityRecognitionOutput - The return type for the keyEntityRecognition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KeyEntityRecognitionInputSchema = z.object({
  legalDocumentText: z.string().describe('The text of the legal document to analyze.'),
});
export type KeyEntityRecognitionInput = z.infer<
  typeof KeyEntityRecognitionInputSchema
>;

const KeyEntitySchema = z.object({
  type: z
    .string()
    .describe('The type of entity (e.g., Party, Date, Location, Monetary Amount).'),
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

const prompt = ai.definePrompt({
  name: 'keyEntityRecognitionPrompt',
  input: {schema: KeyEntityRecognitionInputSchema},
  output: {schema: KeyEntityRecognitionOutputSchema},
  prompt: `You are an AI assistant who specializes in analyzing legal documents.

  Extract key entities from the following legal document. Key entities include parties, dates, locations, and monetary amounts.

  Legal Document:
  {{{legalDocumentText}}}

  Please provide only the list of key entities in the structured JSON format.`,
});

const keyEntityRecognitionFlow = ai.defineFlow(
  {
    name: 'keyEntityRecognitionFlow',
    inputSchema: KeyEntityRecognitionInputSchema,
    outputSchema: KeyEntityRecognitionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
