
'use server';

/**
 * @fileOverview A Genkit flow that summarizes legal documents into plain language.
 *
 * - plainLanguageSummarization - A function that takes legal document text and returns a plain language summary.
 * - PlainLanguageSummarizationInput - The input type for the plainLanguageSummarization function.
 * - PlainLanguageSummarizationOutput - The return type for the plainLanguageSummarization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlainLanguageSummarizationInputSchema = z.object({
  legalDocumentText: z.string().describe('The text of the legal document to summarize.'),
  userRole: z
    .enum(['lawyer', 'lawStudent', 'layperson'])
    .describe(
      'The role of the user, which affects the complexity of the summary.  Options are lawyer, lawStudent, and layperson.'
    ),
});
export type PlainLanguageSummarizationInput = z.infer<
  typeof PlainLanguageSummarizationInputSchema
>;

const PlainLanguageSummarizationOutputSchema = z.object({
  plainLanguageSummary: z.string().describe('A plain language summary of the legal document.'),
});
export type PlainLanguageSummarizationOutput = z.infer<
  typeof PlainLanguageSummarizationOutputSchema
>;

export async function plainLanguageSummarization(
  input: PlainLanguageSummarizationInput
): Promise<PlainLanguageSummarizationOutput> {
  return plainLanguageSummarizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'plainLanguageSummarizationPrompt',
  input: {schema: PlainLanguageSummarizationInputSchema},
  output: {schema: PlainLanguageSummarizationOutputSchema},
  prompt: `You are an AI assistant who specializes in simplifying complex legal documents.

  Summarize the following legal document into plain, easy-to-understand language tailored to the user's role.
  The summary should focus on the key points and obligations within the document.

  User Role: {{{userRole}}}
  Legal Document:
  {{{legalDocumentText}}}

  Please provide only the summary in the structured JSON format.`,
});

const plainLanguageSummarizationFlow = ai.defineFlow(
  {
    name: 'plainLanguageSummarizationFlow',
    inputSchema: PlainLanguageSummarizationInputSchema,
    outputSchema: PlainLanguageSummarizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);