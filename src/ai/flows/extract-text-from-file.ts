'use server';
/**
 * @fileOverview A flow to extract text from different file types.
 * This version uses AI-based OCR for all PDF and image files to avoid
 * issues with native parsing libraries in the server environment.
 *
 * - extractTextFromFile - A function that takes a file data URI and returns the text content.
 * - ExtractTextFromFileInput - The input type for the extractTextFromFile function.
 * - ExtractTextFromFileOutput - The return type for the extractTextFromFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import mammoth from 'mammoth';

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

const ocrPrompt = ai.definePrompt({
  name: 'ocrPrompt',
  input: {
    schema: z.object({
      fileDataUri: z.string(),
    }),
  },
  prompt: `Extract the text content from the following document.
  {{media url=fileDataUri}}
  `,
});

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

    if (
      fileType === 'application/pdf' ||
      fileType.startsWith('image/')
    ) {
      // Use AI for OCR on all PDFs and images.
      console.log(`Using AI OCR for file type: ${fileType}`);
      const {text: ocrText} = await ai.generate({
        prompt: `Extract all text from this document image.`,
        input: {
          document: {
            url: fileDataUri,
          },
        },
      });
      text = ocrText;

    } else if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      // Use mammoth for DOCX
      const result = await mammoth.extractRawText({buffer});
      text = result.value;
    } else if (fileType.startsWith('text/')) {
      // Handle plain text files
      text = buffer.toString('utf-8');
    } else {
      console.log(`Unsupported file type: ${fileType}.`);
      text = '';
    }

    return {text};
  }
);
