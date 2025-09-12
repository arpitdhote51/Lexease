
'use server';

/**
 * @fileOverview A Genkit flow that flags risky clauses in a legal document.
 *
 * - riskFlagging - A function that takes legal document text and returns a list of risky clauses.
 * - RiskFlaggingInput - The input type for the riskFlagging function.
 * - RiskFlaggingOutput - The return type for the riskFlagging function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RiskFlaggingInputSchema = z.object({
  legalDocumentText: z.string().describe('The text of the legal document to analyze.'),
});
export type RiskFlaggingInput = z.infer<typeof RiskFlaggingInputSchema>;

const RiskFlaggingOutputSchema = z.object({
  riskyClauses: z
      .array(z.string())
      .describe(
        'An array of potentially risky or unusual clauses identified in the legal text.'
      ),
});
export type RiskFlaggingOutput = z.infer<typeof RiskFlaggingOutputSchema>;

export async function riskFlagging(
  input: RiskFlaggingInput
): Promise<RiskFlaggingOutput> {
  return riskFlaggingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskFlaggingPrompt',
  input: {schema: RiskFlaggingInputSchema},
  output: {schema: RiskFlaggingOutputSchema},
  prompt: `You are an AI assistant who specializes in analyzing legal documents for potential risks.

  Identify and extract any clauses from the following legal document that appear risky, unusual, or potentially problematic.

  Legal Document:
  {{{legalDocumentText}}}

  Please provide only the list of risky clauses in the structured JSON format.`,
});

const riskFlaggingFlow = ai.defineFlow(
  {
    name: 'riskFlaggingFlow',
    inputSchema: RiskFlaggingInputSchema,
    outputSchema: RiskFlaggingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
