'use server';

/**
 * @fileOverview A server-side flow for parsing document files (PDF, DOCX, TXT).
 *
 * - parseDocument - A function that handles parsing the file content.
 * - ParseDocumentInput - The input type for the parseDocument function.
 * - ParseDocumentOutput - The return type for the parseDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

const ParseDocumentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseDocumentInput = z.infer<typeof ParseDocumentInputSchema>;

const ParseDocumentOutputSchema = z.object({
  documentText: z.string().describe('The extracted text content from the document.'),
});
export type ParseDocumentOutput = z.infer<typeof ParseDocumentOutputSchema>;

export async function parseDocument(input: ParseDocumentInput): Promise<ParseDocumentOutput> {
  return parseDocumentFlow(input);
}

const parseDocumentFlow = ai.defineFlow(
  {
    name: 'parseDocumentFlow',
    inputSchema: ParseDocumentInputSchema,
    outputSchema: ParseDocumentOutputSchema,
  },
  async ({ fileDataUri }) => {
    const match = fileDataUri.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URI format.');
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let documentText = '';

    try {
        if (mimeType === 'application/pdf') {
            const data = await pdf(buffer);
            documentText = data.text;
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            documentText = result.value;
        } else if (mimeType === 'text/plain') {
            documentText = buffer.toString('utf8');
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }
    } catch (error) {
        console.error('Server-side parsing failed:', error);
        throw new Error(`Failed to parse the document on the server. Details: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { documentText };
  }
);
