'use server';

/**
 * @fileOverview Implements the risk flagging flow to identify potentially risky or unusual clauses within a legal document.
 *
 * - riskFlagging - A function that takes legal document text as input and returns identified risky clauses.
 * - RiskFlaggingInput - The input type for the riskFlagging function.
 * - RiskFlaggingOutput - The return type for the riskFlagging function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RiskFlaggingInputSchema = z.object({
  documentText: z.string().describe('The text of the document to analyze.'),
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

const riskFlaggingPrompt = ai.definePrompt({
  name: 'riskFlaggingPrompt',
  input: {schema: RiskFlaggingInputSchema},
  output: {schema: RiskFlaggingOutputSchema},
  prompt: `You are an AI legal assistant tasked with identifying potentially risky or unusual clauses in legal documents.

  Analyze the following legal text and identify any clauses that could be problematic, unusual, or create a potential risk for the user. Provide a list of the risky clauses.

  Legal Text:
  {{{documentText}}}

  Return only a list of the potentially risky clauses in the structured JSON format.
  `,
});

const riskFlaggingFlow = ai.defineFlow(
  {
    name: 'riskFlaggingFlow',
    inputSchema: RiskFlaggingInputSchema,
    outputSchema: RiskFlaggingOutputSchema,
  },
  async input => {
    const {output} = await riskFlaggingPrompt(input);
    return output!;
  }
);
