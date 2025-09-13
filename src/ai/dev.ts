import { config } from 'dotenv';
config();

import '@/ai/flows/extract-text.ts';
import '@/ai/flows/plain-language-summary.ts';
import '@/ai/flows/key-entity-recognition.ts';
import '@/ai/flows/risk-flagging.ts';
import '@/ai/flows/interactive-qa.ts';
import '@/ai/flows/text-to-speech.ts';
