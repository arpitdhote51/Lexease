'use server';

/**
 * @fileOverview A Genkit flow that performs a comprehensive analysis of a legal document.
 * This file is updated to run analysis in the background and update Firestore incrementally.
 *
 * - analyzeDocumentInBackground - A function that takes a document ID and user role,
 *   runs the analysis, and updates Firestore with partial results.
 * - DocumentAnalysisInput - The input type for the analysis function.
 * - DocumentAnalysisOutput - The return type for the analysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {db} from '@/lib/firebase';

const DocumentAnalysisInputSchema = z.object({
  documentId: z.string().describe('The ID of the document in Firestore.'),
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

export async function analyzeDocumentInBackground(
  input: DocumentAnalysisInput
): Promise<void> {
  await documentAnalysisFlow(input);
}

// Prompt for Summarization
const summaryPrompt = ai.definePrompt({
  name: 'summaryPrompt',
  input: {
    schema: z.object({
      documentText: z.string(),
      userRole: z.enum(['lawyer', 'lawStudent', 'layperson']),
    }),
  },
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
    outputSchema: z.void(),
  },
  async ({documentId, userRole}) => {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    const documentText = docSnap.data().documentText;

    // We don't await these. We let them run and update the db independently.
    summaryPrompt({documentText, userRole}).then(async ({output}) => {
      if (output) await updateDoc(docRef, {'analysis.summary': output});
    });

    entitiesPrompt({documentText}).then(async ({output}) => {
      if (output) await updateDoc(docRef, {'analysis.entities': output});
    });

    risksPrompt({documentText}).then(async ({output}) => {
      if (output) await updateDoc(docRef, {'analysis.risks': output});
    });
  }
);
