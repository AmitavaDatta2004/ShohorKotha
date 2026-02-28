'use server';

/**
 * @fileOverview An image analysis AI agent that assesses the severity of an issue from an image.
 *
 * - analyzeImageSeverity - A function that handles the image severity analysis process.
 * - AnalyzeImageSeverityInput - The input type for the analyzeImageSeverity function.
 * - AnalyzeImageSeverityOutput - The return type for the analyzeImageSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageSeverityInputSchema = z.object({
  photoDataUris: z.array(z
    .string()
    .describe(
      'A photo of the issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    )),
});
export type AnalyzeImageSeverityInput = z.infer<typeof AnalyzeImageSeverityInputSchema>;

const AnalyzeImageSeverityOutputSchema = z.object({
  isRelevant: z.boolean().describe('Whether the image is relevant to a civic issue.'),
  rejectionReason: z.string().optional().describe('The reason for rejection if the image is not relevant.'),
  severityScore: z
    .number()
    .optional()
    .describe(
      'A score from 1-10 indicating the severity of the issue, with 1 being minor and 10 being critical. This should only be provided if isRelevant is true.'
    ),
  reasoning: z.string().optional().describe('The AI reasoning behind the severity score. This should only be provided if isRelevant is true.'),
});
export type AnalyzeImageSeverityOutput = z.infer<typeof AnalyzeImageSeverityOutputSchema>;

export async function analyzeImageSeverity(
  input: AnalyzeImageSeverityInput
): Promise<AnalyzeImageSeverityOutput> {
  return analyzeImageSeverityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImageSeverityPrompt',
  input: {schema: AnalyzeImageSeverityInputSchema},
  output: {schema: AnalyzeImageSeverityOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing images to determine the severity of civic issues.

First, determine if the provided images are real photos of a civic issue (e.g., pothole, graffiti, broken streetlight, etc.). The images should not be a selfie, cartoon, or irrelevant photo.

- If the images are NOT relevant, set isRelevant to false and provide a rejectionReason.
- If the images ARE relevant, set isRelevant to true and proceed with the analysis.

For relevant images, assess the severity on a scale of 1 to 10, where 1 is a minor issue and 10 is a critical issue. Provide a severity score and a brief explanation of your reasoning.

Here are the images:

{{#each photoDataUris}}
{{media url=this}}
{{/each}}

Consider factors like public safety, environmental impact, and disruption to daily life when determining the severity score.

Ensure your response follows the output schema.`,
});

const analyzeImageSeverityFlow = ai.defineFlow(
  {
    name: 'analyzeImageSeverityFlow',
    inputSchema: AnalyzeImageSeverityInputSchema,
    outputSchema: AnalyzeImageSeverityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
