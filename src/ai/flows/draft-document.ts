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


// Tool to find relevant legal templates.
// This is a simplified version that returns a hardcoded template to ensure functionality.
const findRelevantTemplates = ai.defineTool(
    {
      name: 'findRelevantTemplates',
      description: 'Retrieves a basic template for a given legal document type.',
      inputSchema: z.object({
        documentType: z.string().describe('The type of document to search for (e.g., "Affidavit", "Agreement").'),
        language: z.string().describe('The language of the template required.'),
      }),
      outputSchema: z.object({
        template: z.string().describe('The content of the legal template.'),
      }),
    },
    async ({ documentType, language }) => {
      console.log(`Providing hardcoded template for: ${documentType} in ${language}`);
      // Return a very basic, generic template based on the type.
      // This bypasses GCS to ensure the feature works.
      let template = '';
      if (documentType.toLowerCase().includes('affidavit')) {
        template = `
          BEFORE THE NOTARY PUBLIC AT [City]
          
          AFFIDAVIT
          
          I, [Full Name], son/daughter of [Father's Name], aged [Age], residing at [Full Address], do hereby solemnly affirm and declare as under:
          
          1. That I am the deponent herein and a citizen of India.
          2. That the facts stated in this affidavit are true to my knowledge.
          
          [Add user-provided details here...]

          DEPONENT
          
          VERIFICATION
          Verified at [Place] on this [Date] that the contents of the above affidavit are true and correct to the best of my knowledge and belief.
          
          DEPONENT
        `;
      } else if (documentType.toLowerCase().includes('agreement')) {
        template = `
          AGREEMENT
          
          This Agreement is made and entered into on this [Date] by and between:
          
          [Party A Name], having its principal place of business at [Party A Address] (hereinafter referred to as "Party A"),
          
          AND
          
          [Party B Name], having its principal place of business at [Party B Address] (hereinafter referred to as "Party B").
          
          [Add user-provided details about the agreement clauses here...]
          
          IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.
          
          PARTY A: _________________
          PARTY B: _________________
        `;
      } else { // Fallback for Bail or other types
         template = `
          BEFORE THE COURT OF [Court Name] AT [City]
          
          APPLICATION FOR [Document Type]
          
          [Add user-provided details here...]

          APPLICANT
         `;
      }

      return { template };
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
    const { output } = await draftingAgentPrompt(input);
    return output!;
  }
);
