'use server';

/**
 * @fileOverview A flow to determine the priority of an issue based on image analysis and NLP of user notes.
 *
 * - determineIssuePriority - A function that determines the priority of the reported issue.
 * - DetermineIssuePriorityInput - The input type for the determineIssuePriority function.
 * - DetermineIssuePriorityOutput - The return type for the determineIssuePriority function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetermineIssuePriorityInputSchema = z.object({
  imageAnalysisScore: z
    .number()
    .describe('The severity score of the issue obtained from image analysis.'),
  category: z.string().describe('The category of the reported issue.'),
  notes: z.string().optional().describe('The text notes provided by the user.'),
  audioTranscription: z.string().optional().describe('The transcription from the user\'s audio note.'),
});
export type DetermineIssuePriorityInput = z.infer<
  typeof DetermineIssuePriorityInputSchema
>;

const DetermineIssuePriorityOutputSchema = z.object({
  priorityLevel: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The overall priority level of the reported issue.'),
});
export type DetermineIssuePriorityOutput = z.infer<
  typeof DetermineIssuePriorityOutputSchema
>;

export async function determineIssuePriority(
  input: DetermineIssuePriorityInput
): Promise<DetermineIssuePriorityOutput> {
  return determineIssuePriorityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'determineIssuePriorityPrompt',
  input: {schema: DetermineIssuePriorityInputSchema},
  output: {schema: DetermineIssuePriorityOutputSchema},
  prompt: `You are an AI assistant that determines the priority level of a reported issue based on its category, user notes, and an image analysis score.

  The priority level should be one of the following: Low, Medium, or High.

  Consider these factors when determining the priority level:

  - Image Analysis Score: A higher score indicates a more severe issue.  Consider this heavily when setting the priority.
  - Category:  Certain categories of issues are inherently more critical than others. For example, a "Safety Hazard" should have higher priority.
  - Notes & Transcription:  The user's notes provide additional context.  Pay attention to keywords that indicate urgency or severity, such as "urgent", "critical", "dangerous", etc.

  Here's the information about the issue:

  Category: {{{category}}}
  Written Notes: {{{notes}}}
  Audio Transcription: {{{audioTranscription}}}
  Image Analysis Score: {{{imageAnalysisScore}}}

  Based on the information above, what is the priority level of this issue?  Respond with only the priority level.`,
});

const determineIssuePriorityFlow = ai.defineFlow(
  {
    name: 'determineIssuePriorityFlow',
    inputSchema: DetermineIssuePriorityInputSchema,
    outputSchema: DetermineIssuePriorityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
