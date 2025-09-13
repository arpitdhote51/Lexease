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
    
    const filePath = `${language.toLowerCase()}_drafts/Affidavit.txt`;
    
    try {
      console.log(`Attempting to read from GCS: gs://${bucketName}/${filePath}`);
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
      console.warn(`Could not retrieve template from GCS. Falling back to basic template. Error:`, error);
      // Fallback to a basic template if GCS fails
      const fallbackTemplate = `
        Format for Affidavit:
        (To be Printed in a Rs. 20 Stamp Paper)

        AFFIDAVIT OF [Mr./Ms./Mrs. Name]

        I, [Name], S/o, D/o [Father's Name], aged about [Age] years and residing at [Address], do hereby solemnly affirm and sincerely state as follows:

        I state that I have lost my [Degree/Certificate Type] degree certificate/Grade sheets/Consolidated Grade Sheet, Certificate Serial No's are [Certificate Serial Numbers], Registration No. [Registration Number] given in the year [Year of Issue] and if I do manage to recover or find the original certificate, I shall return the duplicate certificate to the concerned authorities at [Name of Institution], [Location of Institution].

        The above mentioned facts are true and correct to the best of my knowledge, information and belief.


        Signature of the Deponent


        Solemnly affirmed at [Place of Affirmation]
        On this [Day] day of [Month]

        Deponent signed before me

        And signed his/her name in my presence
        
        Seal of the Notary
      `;
      return { template: fallbackTemplate };
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
        2. Once you have the template, carefully integrate the user-provided details into it. Fill in all placeholders like [Name], [Age], [Address], [Degree/Certificate Type], [Registration Number], etc., with the information from the user's input. The user's input may not be structured, so intelligently extract the information.
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
