'use server';

/**
 * @fileOverview A flow to estimate the resolution time for a new issue.
 *
 * - estimateResolutionTime - A function that estimates the resolution time based on priority and workload.
 * - EstimateResolutionTimeInput - The input type for the function.
 * - EstimateResolutionTimeOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateResolutionTimeInputSchema = z.object({
  priority: z.enum(['Low', 'Medium', 'High']).describe('The priority of the issue.'),
  pendingTicketsCount: z.number().describe('The number of currently unresolved tickets in the system.'),
});
export type EstimateResolutionTimeInput = z.infer<
  typeof EstimateResolutionTimeInputSchema
>;

const EstimateResolutionTimeOutputSchema = z.object({
  resolutionDays: z.number().describe('The estimated number of days to resolve the issue.'),
});
export type EstimateResolutionTimeOutput = z.infer<
  typeof EstimateResolutionTimeOutputSchema
>;

export async function estimateResolutionTime(
  input: EstimateResolutionTimeInput
): Promise<EstimateResolutionTimeOutput> {
  return estimateResolutionTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateResolutionTimePrompt',
  input: {schema: EstimateResolutionTimeInputSchema},
  output: {schema: EstimateResolutionTimeOutputSchema},
  prompt: `You are an expert municipal operations manager responsible for estimating ticket resolution times.

Your goal is to provide a realistic estimate in days.

Start with a baseline based on priority:
- High priority: 3 days
- Medium priority: 7 days
- Low priority: 14 days

Now, adjust this baseline based on the current workload. A higher number of pending tickets means more work pressure and longer resolution times.

- For every 10 pending tickets, add 1 day to the estimate.
- For a High priority ticket, the adjustment for pending work should be less impactful. Halve the number of days you add due to workload.

Current issue priority: {{{priority}}}
Number of pending tickets: {{{pendingTicketsCount}}}

Calculate the final estimated resolution time in days. Provide only the number of days.`,
});

const estimateResolutionTimeFlow = ai.defineFlow(
  {
    name: 'estimateResolutionTimeFlow',
    inputSchema: EstimateResolutionTimeInputSchema,
    outputSchema: EstimateResolutionTimeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
