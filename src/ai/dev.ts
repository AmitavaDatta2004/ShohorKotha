'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-image-severity.ts';
import '@/ai/flows/determine-issue-priority.ts';
import '@/ai/flows/generate-issue-title.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/analyze-completion-report.ts';
import '@/ai/flows/detect-ai-image.ts';
import '@/ai/flows/estimate-resolution-time.ts';
