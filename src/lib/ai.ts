import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const AI_CONFIG = {
  geminiModel: 'gemini-3.8-flash',
  groqModel: 'openai/gpt-oss-20b',
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy' });

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateWithFallback(prompt: string, operation: string): Promise<string> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        console.log(`[AI] provider=gemini model=${AI_CONFIG.geminiModel} operation=${operation} status=retry retry=${attempt}`);
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500;
        await sleep(delay);
      } else {
        console.log(`[AI] Gemini request started. operation=${operation}`);
      }

      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
      
      const model = genAI.getGenerativeModel({ model: AI_CONFIG.geminiModel });
      const result = await model.generateContent(prompt);
      
      console.log(`[AI] Gemini request succeeded. operation=${operation}`);
      return result.response.text();

    } catch (error: any) {
      const msg = error.message || '';
      console.error(`[AI] Gemini request failed. operation=${operation} error=${msg}`);

      const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('timeout') || msg.includes('demand');
      
      if (!isTransient || attempt === maxRetries) {
        if (attempt === maxRetries) {
          console.log(`[AI] Gemini exhausted retries. operation=${operation}`);
        }
        break; 
      }
      attempt++;
    }
  }

  console.log(`[AI] Falling back to Groq. operation=${operation}`);
  try {
    console.log(`[AI] Groq request started. operation=${operation}`);
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy') {
      throw new Error('GROQ_API_KEY is not configured');
    }
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: AI_CONFIG.groqModel,
    });
    
    console.log(`[AI] Groq request succeeded. operation=${operation}`);
    return completion.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error(`[AI] Groq request failed. operation=${operation} error=${error.message || 'Unknown'}`);
    throw new Error('AI generation is temporarily unavailable. Please try again shortly.');
  }
}
