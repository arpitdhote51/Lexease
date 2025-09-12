'use server';

/**
 * @fileOverview A Genkit flow that performs a comprehensive analysis of a legal document.
 * This file is updated to split the single analysis prompt into three smaller, more focused prompts
 * for summarization, entity extraction, and risk flagging to improve performance.
 *
 * - analyzeDocument - A function that takes legal document text and returns a full analysis.
 * - DocumentAnalysisInput - The input type for the analyzeDocument function.
 * - DocumentAnalysisOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentAnalysisInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text of the legal document to analyze.'),
  userRole: z
    .enum(['lawyer', 'lawStudent', 'layperson'])
    .describe(
      'The role of the user, which affects the complexity of the summary. Options are lawyer, lawStudent, and layperson.'
    ),
});
export type DocumentAnalysisInput = z.infer<typeof DocumentAnalysisInputSchema>;

const KeyEntitySchema = z.object({
  type: z
    .string()
    .describe('The type of entity (e.g., party, date, location).'),
  value: z.string().describe('The actual text of the entity.'),
});

export type KeyEntity = z.infer<typeof KeyEntitySchema>;

const DocumentAnalysisOutputSchema = z.object({
  summary: z.object({
    plainLanguageSummary: z
      .string()
      .describe(
        "A plain language summary of the legal document, tailored to the user's role."
      ),
  }),
  entities: z.object({
    entities: z
      .array(KeyEntitySchema)
      .describe('A list of key entities identified in the document.'),
  }),
  risks: z.object({
    riskyClauses: z
      .array(z.string())
      .describe(
        'An array of potentially risky or unusual clauses identified in the legal text.'
      ),
  }),
});
export type DocumentAnalysisOutput = z.infer<
  typeof DocumentAnalysisOutputSchema
>;

export async function analyzeDocument(
  input: DocumentAnalysisInput
): Promise<DocumentAnalysisOutput> {
  return documentAnalysisFlow(input);
}

// Prompt for Summarization
const summaryPrompt = ai.definePrompt({
  name: 'summaryPrompt',
  input: {schema: DocumentAnalysisInputSchema},
  output: {schema: DocumentAnalysisOutputSchema.shape.summary},
  prompt: `You are an AI legal assistant. Summarize the provided legal document into plain, easy-to-understand language. The summary's complexity should be tailored to the user's role.

  User Role: {{{userRole}}}
  Legal Document:
  {{{documentText}}}

  Please provide only the summary in the structured JSON format.
  `,
});

// Prompt for Entity Extraction
const entitiesPrompt = ai.definePrompt({
  name: 'entitiesPrompt',
  input: {schema: z.object({documentText: z.string()})},
  output: {schema: DocumentAnalysisOutputSchema.shape.entities},
  prompt: `You are an AI legal assistant. Identify and extract key entities from the provided legal document, including parties, dates, locations, and monetary amounts.

  Legal Document:
  {{{documentText}}}

  Please provide only the list of key entities in the structured JSON format.
  `,
});

// Prompt for Risk Flagging
const risksPrompt = ai.definePrompt({
  name: 'risksPrompt',
  input: {schema: z.object({documentText: z.string()})},
  output: {schema: DocumentAnalysisOutputSchema.shape.risks},
  prompt: `You are an AI legal assistant. Analyze the provided legal document and flag any clauses that appear risky, unusual, or potentially problematic.

  Legal Document:
  {{{documentText}}}

  Please provide only the list of risky clauses in the structured JSON format.
  `,
});

const documentAnalysisFlow = ai.defineFlow(
  {
    name: 'documentAnalysisFlow',
    inputSchema: DocumentAnalysisInputSchema,
    outputSchema: DocumentAnalysisOutputSchema,
  },
  async input => {
    // Run all three prompts.
    const [summaryResult, entitiesResult, risksResult] = await Promise.all([
      summaryPrompt(input),
      entitiesPrompt({documentText: input.documentText}),
      risksPrompt({documentText: input.documentText}),
    ]);

    const output: DocumentAnalysisOutput = {
      summary: summaryResult.output!,
      entities: entitiesResult.output!,
      risks: risksResult.output!,
    };
    
    return output;
  }
);
