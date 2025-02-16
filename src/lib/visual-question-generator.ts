// import { OpenAI } from "openai";
// import { VQ_GEN_SYSTEM_INSTRUCTION } from "./prompts";

// async function visualQuestionGeneration(context: string): Promise<Step | null> {
//     const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
//     try {
//       const response = await openaiClient.beta.chat.completions.create({
//         model: "o1",
//         messages: [
//           { role: "user", content: VQ_GEN_SYSTEM_INSTRUCTION },
//           { role: "user", content: `Current User Context: ${context}` }
//         ],
//         response_format: "json"
//       });
  
//       return response.data.choices[0].message;
//     } catch (error) {
//       console.error("Error in visual question generation:", error);
//       return null;
//     }
//   }