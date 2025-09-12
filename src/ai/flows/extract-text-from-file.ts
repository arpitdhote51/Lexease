'use server';
/**
 * @fileOverview A flow to extract text from different file types.
 *
 * - extractTextFromFile - A function that takes a file data URI and returns the text content.
 * - ExtractTextFromFileInput - The input type for the extractTextFromFile function.
 * - ExtractTextFromFileOutput - The return type for the extractTextFromFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

const ExtractTextFromFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A file encoded as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileType: z.string().describe('The MIME type of the file.'),
});
export type ExtractTextFromFileInput = z.infer<typeof ExtractTextFromFileInputSchema>;

const ExtractTextFromFileOutputSchema = z.object({
  text: z.string().describe('The extracted text from the file.'),
});
export type ExtractTextFromFileOutput = z.infer<
  typeof ExtractTextFromFileOutputSchema
>;

export async function extractTextFromFile(
  input: ExtractTextFromFileInput
): Promise<ExtractTextFromFileOutput> {
  return extractTextFromFileFlow(input);
}

const extractTextFromFileFlow = ai.defineFlow(
  {
    name: 'extractTextFromFileFlow',
    inputSchema: ExtractTextFromFileInputSchema,
    outputSchema: ExtractTextFromFileOutputSchema,
  },
  async ({fileDataUri, fileType}) => {
    const base64Data = fileDataUri.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    let text = '';

    if (fileType === 'application/pdf') {
      const data = await pdf(buffer);
      text = data.text;
    } else if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({buffer});
      text = result.value;
    } else if (fileType.startsWith('text/')) {
      text = buffer.toString('utf-8');
    } else {
      // We are explicitly not handling images or other file types to avoid OCR costs.
      console.log(`Unsupported file type: ${fileType}. Only PDF, DOCX, and TXT are processed.`);
      text = '';
    }

    return {text};
  }
);
