'use server';

/**
 * @fileOverview An AI agent for drafting legal documents using a tool-based approach.
 *
 * - draftDocument - A function that handles the document drafting process.
 * - DraftDocumentInput - The input type for the draftDocument function.
 * - DraftDocumentOutput - The return type for the draftDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Storage } from '@google-cloud/storage';

const DraftDocumentInputSchema = z.object({
  documentType: z.string().describe('The type of legal document to draft (e.g., "Simple Affidavit").'),
  language: z.string().describe('The language for the draft (e.g., "English", "Hindi").'),
  userInputs: z.string().describe('A string containing user-provided details to fill into the document.'),
});
export type DraftDocumentInput = z.infer<typeof DraftDocumentInputSchema>;

const DraftDocumentOutputSchema = z.object({
  draftContent: z.string().describe('The generated legal document draft.'),
});
export type DraftDocumentOutput = z.infer<typeof DraftDocumentOutputSchema>;

// Tool to find relevant legal templates from GCS.
const findRelevantTemplates = ai.defineTool(
  {
    name: 'findRelevantTemplates',
    description: 'Retrieves a template from Google Cloud Storage for a given legal document type.',
    inputSchema: z.object({
      documentType: z.string().describe('The type of document to search for (e.g., "Affidavit").'),
      language: z.string().describe('The language of the template required.'),
    }),
    outputSchema: z.object({
      template: z.string().describe('The content of the legal template.'),
    }),
  },
  async ({ documentType, language }) => {
    const storage = new Storage();
    const bucketName = 'legal_drafts';
    
    // Simplified path for now to ensure connectivity.
    // E.g., legal_drafts/english_drafts/Affidavit.txt
    const filePath = `${language.toLowerCase()}_drafts/Affidavit.txt`;
    
    console.log(`Attempting to read from GCS: gs://${bucketName}/${filePath}`);

    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
      
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      const [content] = await file.download();
      const template = content.toString('utf8');
      
      if (!template) {
          throw new Error('Template file is empty.');
      }

      return { template };
    } catch (error) {
      console.error(`Failed to read from GCS bucket "${bucketName}":`, error);
      throw new Error(`Could not retrieve template for "${documentType}" in ${language}.`);
    }
  }
);


// Agentic prompt that uses the tool
const draftingAgentPrompt = ai.definePrompt({
    name: 'draftingAgentPrompt',
    tools: [findRelevantTemplates],
    output: { schema: DraftDocumentOutputSchema },
    prompt: `
        You are an expert legal drafting assistant.
        Your task is to generate a formal legal document based on user-provided details.

        1. First, use the 'findRelevantTemplates' tool to retrieve the appropriate template for the requested document type and language.
        2. Once you have the template, carefully integrate the user-provided details into it. Fill in all placeholders like [Name], [Age], [Address], etc., with the information from the user's input.
        3. Ensure the final document is coherent, complete, and professionally formatted based on the structure of the retrieved template.

        USER-PROVIDED DETAILS:
        ---
        Document Type: {{{documentType}}}
        Language: {{{language}}}
        Details: {{{userInputs}}}
        ---

        Generate the final document in the requested language only. Do not add any extra explanations, headers, or conversational text.
    `,
});


export async function draftDocument(input: DraftDocumentInput): Promise<DraftDocumentOutput> {
  return draftDocumentFlow(input);
}

const draftDocumentFlow = ai.defineFlow(
  {
    name: 'draftDocumentFlow',
    inputSchema: DraftDocumentInputSchema,
    outputSchema: DraftDocumentOutputSchema,
  },
  async (input) => {
    // For now, we only support Affidavit to test the GCS connection.
    const flowInput = { ...input, documentType: 'Affidavit' };
    const { output } = await draftingAgentPrompt(flowInput);
    return output!;
  }
);
