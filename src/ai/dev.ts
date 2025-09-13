
import { config } from 'dotenv';
config();

import '@/ai/flows/plain-language-summary.ts';
import '@/ai/flows/key-entity-recognition.ts';
import '@/ai/flows/risk-flagging.ts';
import '@/ai/flows/interactive-qa.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/draft-document.ts';
import '@/ai/flows/list-templates.ts';
import '@/ai/flows/general-legal-qa.ts';
