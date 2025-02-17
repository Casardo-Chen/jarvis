import { OpenAI } from "openai";
import { VQ_GEN_SYSTEM_INSTRUCTION } from "./prompts";



async function visualQuestionGeneration(context: string): Promise<string | null> {
    const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
    try {
      const response = await openaiClient.beta.chat.completions.parse({
        model: "o1",
        messages: [
          { role: "user", content: VQ_GEN_SYSTEM_INSTRUCTION },
          { role: "user", content: `Current User Context: ${context}` }
        ],
      });
      console.log("Visual question generation response:", response);
  
      return response.choices[0].message.parsed;
    } catch (error) {
      console.error("Error in visual question generation:", error);
      return null;
    }
  }