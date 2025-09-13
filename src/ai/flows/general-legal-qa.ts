
'use server';

/**
 * @fileOverview An AI agent for answering general legal questions.
 *
 * - generalLegalQA - A function that handles the general question answering process.
 * - GeneralLegalQAInput - The input type for the generalLegalQA function.
 * - GeneralLegalQAOutput - The return type for the generalLegalQA function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralLegalQAInputSchema = z.object({
  question: z.string().describe('The user question about a legal topic.'),
});
export type GeneralLegalQAInput = z.infer<typeof GeneralLegalQAInputSchema>;

const GeneralLegalQAOutputSchema = z.object({
  answer: z
    .string()
    .describe(
      'The answer to the user question based on general legal knowledge.'
    ),
});
export type GeneralLegalQAOutput = z.infer<typeof GeneralLegalQAOutputSchema>;

export async function generalLegalQA(
  input: GeneralLegalQAInput
): Promise<GeneralLegalQAOutput> {
  return generalLegalQAFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generalLegalQAPrompt',
  input: {schema: GeneralLegalQAInputSchema},
  output: {schema: GeneralLegalQAOutputSchema},
  prompt: `You are "Lexy," a highly capable AI legal assistant designed for Indian legal professionals. Your role is to provide accurate, comprehensive, and well-structured answers to legal questions based on your extensive knowledge of Indian law.

When answering, you must adhere to the following principles:
- Maintain an up-to-date knowledge base of all Central and major State statutes, rules, regulations, and current judicial decisions.
- Understand and apply procedural law (civil, criminal, tribunal practice).
- Cite statutes and cases accurately using Indian citation conventions (e.g., SCC, AIR, CriLJ).
- Structure legal reasoning in IRAC/CRAC format where appropriate.
- Prioritize clarity, precision, and reliability.
- If a question is outside your scope or requires legal advice you cannot give, you must state that you are an AI assistant and cannot provide legal advice, recommending consultation with a qualified human lawyer.

User's Question:
{{{question}}}

Provide a clear and comprehensive answer based on your knowledge of Indian law.
  `,
});

const generalLegalQAFlow = ai.defineFlow(
  {
    name: 'generalLegalQAFlow',
    inputSchema: GeneralLegalQAInputSchema,
    outputSchema: GeneralLegalQAOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
