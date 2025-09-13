'use server';

/**
 * @fileOverview A Genkit flow to list available templates from Google Cloud Storage.
 *
 * - listTemplates - A function that returns a list of template file names from the GCS bucket.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Storage } from '@google-cloud/storage';

const ListTemplatesOutputSchema = z.object({
  templates: z.array(z.string()).describe('A list of available template file names.'),
});
export type ListTemplatesOutput = z.infer<typeof ListTemplatesOutputSchema>;

export async function listTemplates(): Promise<ListTemplatesOutput> {
  return listTemplatesFlow();
}

const listTemplatesFlow = ai.defineFlow(
  {
    name: 'listTemplatesFlow',
    inputSchema: z.void(),
    outputSchema: ListTemplatesOutputSchema,
  },
  async () => {
    console.log('Listing templates from GCS...');
    const storage = new Storage();
    const bucketName = 'legal_drafts';

    try {
      const bucket = storage.bucket(bucketName);
      const [files] = await bucket.getFiles();

      const templateNames = files
        // Filter out folder names (which end with a '/')
        .filter(file => !file.name.endsWith('/'))
        // Extract just the file name from the full path
        .map(file => {
          const parts = file.name.split('/');
          return parts[parts.length - 1];
        });
      
      // Remove duplicates
      const uniqueTemplates = [...new Set(templateNames)];

      return { templates: uniqueTemplates };
    } catch (error) {
      console.error(`Failed to list files from GCS bucket "${bucketName}":`, error);
      // Return an empty list on error to prevent the UI from crashing
      return { templates: [] };
    }
  }
);
