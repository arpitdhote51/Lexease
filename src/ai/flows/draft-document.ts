'use server';

/**
 * @fileOverview An AI agent for drafting legal documents.
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


export async function draftDocument(input: DraftDocumentInput): Promise<DraftDocumentOutput> {
  return draftDocumentFlow(input);
}

const draftDocumentFlow = ai.defineFlow(
  {
    name: 'draftDocumentFlow',
    inputSchema: DraftDocumentInputSchema,
    outputSchema: DraftDocumentOutputSchema,
  },
  async ({ documentType, language, userInputs }) => {
    
    const templateData = templates.find(t => t.documentType === documentType);
    if (!templateData) {
        throw new Error(`Template for document type "${documentType}" not found.`);
    }

    const template = templateData.languages[language as keyof typeof templateData.languages] || templateData.languages.English;
    if (!template) {
        throw new Error(`Template for language "${language}" not found for document type "${documentType}".`);
    }

    const prompt = `
        You are an expert legal drafting assistant for the Indian legal system.
        Your task is to generate a formal, legally compliant '${documentType}' in the ${language} language.

        Use the following sample template as a strict guideline for structure, formatting, and statutory language. Do not deviate from the core structure of the template.
        
        TEMPLATE:
        ---
        ${template}
        ---

        Now, carefully integrate the following user-provided details into the template. Fill in the placeholders (like [Name], [Age], [Address], [Statement]) with the corresponding information from the user's input. Ensure the final document is coherent, complete, and professionally formatted.

        USER-PROVIDED DETAILS:
        ---
        ${userInputs}
        ---

        Generate the final '${documentType}' in ${language} only. Do not add any extra explanations, headers, or conversational text.
    `;

    const { output } = await ai.generate({
        prompt: prompt,
        output: {
            schema: DraftDocumentOutputSchema,
        },
    });

    return output!;
  }
);
