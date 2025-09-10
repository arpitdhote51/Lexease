import { config } from 'dotenv';
config();

import '@/ai/flows/risk-flagging.ts';
import '@/ai/flows/plain-language-summarization.ts';
import '@/ai/flows/key-entity-recognition.ts';
import '@/ai/flows/interactive-qa.ts';