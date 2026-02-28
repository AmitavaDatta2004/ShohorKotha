'use server';

/**
 * @fileOverview An AI flow to analyze and verify a supervisor's completion report.
 *
 * - analyzeCompletionReport - A function that handles the completion analysis process.
 * - AnalyzeCompletionReportInput - The input type for the analyzeCompletionReport function.
 * - AnalyzeCompletionReportOutput - The return type for the analyzeCompletionReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCompletionReportInputSchema = z.object({
  originalPhotoUrls: z.array(z.string()).describe("The URLs of the photos of the original issue."),
  originalNotes: z.string().optional().describe('The text notes for the original issue.'),
  originalAudioTranscription: z.string().optional().describe('The audio transcription for the original issue.'),
  completionPhotoDataUris: z.array(z
    .string()
    .describe(
      "A photo of the completed work, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )),
  completionNotes: z.string().describe("The supervisor's notes on the completed work."),
});
export type AnalyzeCompletionReportInput = z.infer<typeof AnalyzeCompletionReportInputSchema>;

const AnalyzeCompletionReportOutputSchema = z.object({
  analysis: z.string().describe("The AI's detailed analysis of the completion report, comparing the original issue with the completed work."),
});
export type AnalyzeCompletionReportOutput = z.infer<typeof AnalyzeCompletionReportOutputSchema>;

export async function analyzeCompletionReport(
  input: AnalyzeCompletionReportInput
): Promise<AnalyzeCompletionReportOutput> {
  return analyzeCompletionReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCompletionReportPrompt',
  input: {schema: AnalyzeCompletionReportInputSchema},
  output: {schema: AnalyzeCompletionReportOutputSchema},
  prompt: `You are an AI assistant tasked with verifying civic work completion. Compare the original issue report with the supervisor's completion report.

Analyze both sets of information to determine if the work has been satisfactorily completed.

**Original Issue:**
- Photos of issue: 
{{#each originalPhotoUrls}}
  {{media url=this}}
{{/each}}
- User's written notes: {{{originalNotes}}}
- User's audio transcription: {{{originalAudioTranscription}}}

**Supervisor's Completion Report:**
- Photos of completed work: 
{{#each completionPhotoDataUris}}
  {{media url=this}}
{{/each}}
- Supervisor's notes: {{{completionNotes}}}

Based on your comparison, provide a detailed analysis. Your analysis should:
1.  Describe what the original issue was, based on all photos and notes.
2.  Describe the work the supervisor claims to have done.
3.  Compare the "before" and "after" photos.
4.  Conclude with your assessment of whether the issue appears to be resolved.
`,
});

const analyzeCompletionReportFlow = ai.defineFlow(
  {
    name: 'analyzeCompletionReportFlow',
    inputSchema: AnalyzeCompletionReportInputSchema,
    outputSchema: AnalyzeCompletionReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
