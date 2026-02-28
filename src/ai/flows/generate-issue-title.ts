'use server';

/**
 * @fileOverview A flow to generate a concise title for an issue based on its details.
 *
 * - generateIssueTitle - A function that generates a title for the reported issue.
 * - GenerateIssueTitleInput - The input type for the generateIssueTitle function.
 * - GenerateIssueTitleOutput - The return type for the generateIssueTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIssueTitleInputSchema = z.object({
  category: z.string().describe('The category of the reported issue.'),
  notes: z.string().optional().describe('The text notes provided by the user.'),
  audioTranscription: z.string().optional().describe('The transcription from the user\'s audio note.'),
  severityReasoning: z.string().describe('The AI reasoning behind the severity score.'),
});
export type GenerateIssueTitleInput = z.infer<
  typeof GenerateIssueTitleInputSchema
>;

const GenerateIssueTitleOutputSchema = z.object({
  title: z
    .string()
    .describe('A concise, descriptive title for the issue, suitable for a list view. Max 10 words.'),
});
export type GenerateIssueTitleOutput = z.infer<
  typeof GenerateIssueTitleOutputSchema
>;

export async function generateIssueTitle(
  input: GenerateIssueTitleInput
): Promise<GenerateIssueTitleOutput> {
  return generateIssueTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIssueTitlePrompt',
  input: {schema: GenerateIssueTitleInputSchema},
  output: {schema: GenerateIssueTitleOutputSchema},
  prompt: `You are an AI assistant that creates short, descriptive titles for civic issue reports.

  Based on the category, user notes, and AI analysis, generate a concise title (max 10 words). The title should be easily scannable in a list.

  Example:
  - Category: Pothole
  - Notes: "There's a huge pothole in the middle of the road near the library. It's really deep."
  - Analysis: "The image shows a large, deep pothole that could cause vehicle damage."
  - Title: "Large Pothole on Road Near Library"

  Here's the information for the new issue:

  Category: {{{category}}}
  Written Notes: {{{notes}}}
  Audio Transcription: {{{audioTranscription}}}
  AI Analysis: {{{severityReasoning}}}

  Generate a title for this issue.`,
});

const generateIssueTitleFlow = ai.defineFlow(
  {
    name: 'generateIssueTitleFlow',
    inputSchema: GenerateIssueTitleInputSchema,
    outputSchema: GenerateIssueTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
