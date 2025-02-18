import cn from "classnames";
import { useEffect, useRef, useState, memo } from "react";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import Logger, { LoggerFilterType } from "../logger/Logger";
import { useVisualQuestionStore } from "../../hooks/use-visual-questions";
import { useAudioStreamStore } from "../../hooks/use-audio-stream";
import { useSystemStateStore } from "../../store/use-system-state";
import { type Tool, SchemaType } from "@google/generative-ai";
import {
  ToolCall,
  ToolResponse,
  LiveFunctionResponse,
} from "../../multimodal-live-types";
import { RUNTIME_SYSTEM_INSTRUCTION , PLANNING_SYSTEM_INSTRUCTION, VQ_DESCRIPTION} from "../../lib/prompts";
import './visual-check.scss';
import { visualQuestionGeneration } from "../../lib/visual-question-generator";

interface ResponseObject extends LiveFunctionResponse {
    name: string;
    response: { result: object };
  }

interface CurrentGoal {
    goal: string;
    criteria: string;
}


function VisualCheckComponent() {
    const { connected, client, volume, setConfig, connect, disconnect  } = useLiveAPIContext();
    const { systemState, updateStateOnUserInput, setSystemState } = useSystemStateStore();
    const [toolResponse, setToolResponse] = useState<ToolResponse | null>(null);

    

    useEffect(() => {
        setConfig({
          model: "models/gemini-2.0-flash-exp",
          generationConfig: {
            responseModalities: "audio", // switch to "audio" for audio out
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
            },
          },
          systemInstruction: {
            parts: [
              {
                text: RUNTIME_SYSTEM_INSTRUCTION,
              },
            ],
          },
        });
      }, [setConfig, systemState]);

    useEffect(() => {
        const intervalId = setInterval(() => {
        if (connected && client && volume < 0.1) {
            console.log("sending proactive check")
            client.send([{ text: `
    Given the following set of motivation questions, generate a single concise response (10-15 words total) that includes direction and distance if the answer is "yes." If the answer is "no," leave the response blank without any text.

    Motivation Questions:
    Is there an elevator nearby? If yes, estimate the distance and direction of the elevator.
    Is there an intersection nearby? If yes, describe its layout, including what is on the left, straight ahead, and on the right. Mention any landmarks, signs, or distinct features at each direction.
    Is there a sign or signage nearby? If yes, read the text and describe its location (e.g., on the left wall, above eye level).
    If in a hallway, what is at the end of the hallway? If yes, give a depth estimation of the end from here.
    Is there a staircase nearby? If yes, estimate the distance and direction of the staircase.
    Example Output (if applicable):
    “Intersection ahead: Left-café (5ft), Straight-bookstore (10ft), Right-park (15ft); Sign-left wall (3ft).”

    If none are detected, output: (blank). ` }]);
        }
        }, 10000); // Sends every 10 seconds, adjust the interval as needed
    
        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [connected, client]);

      useEffect(() => {
        const onToolCall = async (toolCall: ToolCall) => {
          const fCalls = toolCall.functionCalls;
          const functionResponses: ResponseObject[] = [];
    
          if (fCalls.length > 0) {
            for (const fCall of fCalls) {
              let functionResponse = {
                id: fCall.id,
                name: fCall.name,
                response: {
                  result: { string_value: `${fCall.name} OK.` },
                },
              };
              switch (fCall.name) {
                case "look_at_lists": {
                  break;
                }
                case "visual_question_generation": {
                  
                  break;
                }
                case "add_to_context": {
                 
                  break;
                }
                case "edit_list": {
                  
                  break;
                }
                case "remove_list": {
                
                  break;
                }
                case "create_list": {
                
                  break;
                }
              }
              if (functionResponse) {
                functionResponses.push(functionResponse);
              }
            };
    
            // Send tool responses back to the model
            const toolResponse: ToolResponse = {
              functionResponses: functionResponses,
            };
            setToolResponse(toolResponse);
          }
        };
        client.on("toolcall", onToolCall);
        return () => {
          client.off("toolcall", onToolCall);
        };
      }, [client]);

        useEffect(() => {
          if (toolResponse) {
            const updatedToolResponse: ToolResponse = {
              ...toolResponse,
              functionResponses: toolResponse.functionResponses.map(
                (functionResponse) => {
                  const responseObject = functionResponse as ResponseObject;
                  if (responseObject.name === "look_at_lists") {
                    return {
                      ...functionResponse,
                      response: {
                        result: {
                          object_value: {
                            test: "test",
                          }
                        },
                      },
                    };
                  } else {
                    return functionResponse;
                  }
                }
              ),
            };
            client.sendToolResponse(updatedToolResponse);
            setToolResponse(null);
          }
        }, [toolResponse, client, setToolResponse]);

        const connectAndSend = async (message: string) => {
            if (!connected) {
              try {
                await connect();
              } catch (error) {
                throw new Error("Could not connect to Websocket");
              }
            }
            client.send({
              text: `${message}`,
            });
          };

    return (
        <div className="visual-check">
            hi


        </div>
    );
}

export const VisualCheck = memo(VisualCheckComponent);
