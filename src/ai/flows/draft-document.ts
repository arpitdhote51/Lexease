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
import { templates } from '@/app/data/draft-templates.json';

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

// Tool to find relevant legal templates
const findRelevantTemplates = ai.defineTool(
    {
      name: 'findRelevantTemplates',
      description: 'Searches for and retrieves the most relevant legal template based on the document type.',
      inputSchema: z.object({
        documentType: z.string().describe('The type of document to search for (e.g., "Simple Affidavit", "Mutual NDA").'),
        language: z.string().describe('The language of the template required.'),
      }),
      outputSchema: z.object({
        template: z.string().describe('The content of the most relevant legal template.'),
      }),
    },
    async ({ documentType, language }) => {
      console.log(`Searching for template: ${documentType} in ${language}`);
      const templateData = templates.find(t => t.documentType === documentType);
      if (!templateData) {
        throw new Error(`Template for document type "${documentType}" not found.`);
      }
  
      const template = templateData.languages[language as keyof typeof templateData.languages] || templateData.languages.English;
      if (!template) {
        throw new Error(`Template for language "${language}" not found for document type "${documentType}".`);
      }
      
      return { template };
    }
);

// New agentic prompt that uses the tool
const draftingAgentPrompt = ai.definePrompt({
    name: 'draftingAgentPrompt',
    tools: [findRelevantTemplates],
    output: { schema: DraftDocumentOutputSchema },
    prompt: `
        You are an expert legal drafting assistant for the Indian legal system.
        Your task is to generate a formal, legally compliant document based on user-provided details.

        1. First, use the 'findRelevantTemplates' tool to retrieve the appropriate template for the requested document type and language.
        2. Once you have the template, carefully integrate the user-provided details into it. Fill in all placeholders like [Name], [Age], [Address], etc., with the information from the user's input.
        3. Ensure the final document is coherent, complete, professionally formatted, and strictly follows the structure of the retrieved template.

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
    const { output } = await draftingAgentPrompt(input);
    return output!;
  }
);
