import { OpenAI } from "openai";
import { VQ_GEN_SYSTEM_INSTRUCTION } from "./prompts";


export async function visualQuestionGeneration(context: string): Promise<string | null> {
    const openaiClient = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY as string, dangerouslyAllowBrowser: true });
  
    try {
      console.log("Visual question generation context:", context);
      const response = await openaiClient.beta.chat.completions.parse({
        model: "o1",
        messages: [
          { role: "user", content: VQ_GEN_SYSTEM_INSTRUCTION },
          { role: "user", content: `Current User Context: ${context}` }
        ],
      });
      console.log("Visual question generation response:", response.choices[0].message.content);
      // save that in the current context and visualize it

      return response.choices[0].message.content;

    } catch (error) {
      console.error("Error in visual question generation:", error);
      return null;
    }
  }