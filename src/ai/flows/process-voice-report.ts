'use server';

/**
 * @fileOverview A Genkit flow to process voice-based incident reports.
 * Uses Gemini 2.5 Flash for multimodal acoustic analysis.
 * 
 * - processVoiceReport - Extracts structured incident data from a raw audio signal.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessVoiceReportInputSchema = z.object({
  audioDataUri: z.string().describe("The audio recording as a base64 data URI (audio/wav)."),
});

const ProcessVoiceReportOutputSchema = z.object({
  title: z.string().describe("A concise title for the issue."),
  category: z.string().describe("The most likely category for the issue."),
  transcription: z.string().describe("Full text of the user's spoken message."),
  address: z.string().describe("Extracted location or landmark mentioned by the user."),
  pincode: z.string().optional().describe("Extracted 6-digit PIN code if mentioned in speech."),
  priority: z.enum(['Low', 'Medium', 'High']).describe("Priority level based on tone and urgency."),
  severityScore: z.coerce.number().describe("Severity score from 1-10."),
  reasoning: z.string().describe("AI reasoning for the classification."),
});

export async function processVoiceReport(input: z.infer<typeof ProcessVoiceReportInputSchema>) {
  return processVoiceReportFlow(input);
}

const processVoiceReportFlow = ai.defineFlow(
  {
    name: 'processVoiceReportFlow',
    inputSchema: ProcessVoiceReportInputSchema,
    outputSchema: ProcessVoiceReportOutputSchema,
  },
  async (input) => {
    // We pass the audio Data URI directly to Gemini 2.5 Flash.
    // The model "listens" to the binary signal to extract intent and data.
    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      output: { schema: ProcessVoiceReportOutputSchema },
      prompt: [
        { text: `You are an AI civic dispatcher. Listen to this voice recording from a citizen reporting an urban issue.
        
        Tasks:
        1. Transcribe the message accurately.
        2. Identify the category (e.g., Pothole, Broken Streetlight, Waste Management, Safety Hazard).
        3. Extract any mentioned address or landmarks.
        4. Look for a 6-digit PIN code explicitly mentioned in the speech.
        5. Determine priority (Low/Medium/High) and severity (1-10) based on the speaker's tone and description.
        6. Create a short, professional title.
        
        If the audio is unclear, use your best interpretation of the civic hazard described.` },
        { media: { url: input.audioDataUri } }
      ]
    });

    if (!result.output) {
      throw new Error("Neural engine failed to synthesize structured output from audio signal.");
    }

    return result.output;
  }
);
