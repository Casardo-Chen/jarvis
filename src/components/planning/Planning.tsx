/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { type Tool, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  ToolCall,
  ToolResponse,
  LiveFunctionResponse,
} from "../../multimodal-live-types";
import { RUNTIME_SYSTEM_INSTRUCTION , PLANNING_SYSTEM_INSTRUCTION, VQ_DESCRIPTION} from "../../lib/prompts";
import './Planning.scss';
import { visualQuestionGeneration } from "../../lib/visual-question-generator";
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { List, ListProps } from "./List";
import { Chips } from "./Chips";
import { useSystemStateStore } from "../../store/use-system-state";
import { sleep } from "openai/core";


// Types
interface StringArgs {
  context: string;
  type: string;
}

interface CreateQuestionArgs {
  id: string;
  heading: string;
  list_array: string[];
}
interface EditListArgs extends CreateQuestionArgs {}
interface RemoveListArgs {
  id: string;
}
interface ResponseObject extends LiveFunctionResponse {
  name: string;
  response: { result: object };
}

// Tools
const toolObject: Tool[] = [
  {
    functionDeclarations: [
      // {
      //   name: "look_at_lists",
      //   description:
      //     "Returns all current lists. Called immediately before calling `edit_list`, to ensure latest version is being edited.",
      // },
      // {
      //   name: "edit_list",
      //   description:
      //     "Edits list with specified id. Requires `id`, `heading`, and `list_array`. You must provide the complete new list array. May be called multiple times, once for each list requiring edit.",
      //   parameters: {
      //     type: SchemaType.OBJECT,
      //     properties: {
      //       id: {
      //         type: SchemaType.STRING,
      //       },
      //       heading: {
      //         type: SchemaType.STRING,
      //       },
      //       list_array: {
      //         type: SchemaType.ARRAY,
      //         items: {
      //           type: SchemaType.STRING,
      //         },
      //       },
      //     },
      //     required: ["id", "heading", "list_array"],
      //   },
      // },
      // {
      //   name: "remove_list",
      //   description:
      //     "Removes the list with specified id. Requires `id`. May be called multiple times, once for each list you want to remove.",
      //   parameters: {
      //     type: SchemaType.OBJECT,
      //     properties: {
      //       id: {
      //         type: SchemaType.STRING,
      //       },
      //     },
      //     required: ["id"],
      //   },
      // },
      {
        name: "visual_question_generation",
        description:
          "Generates a visual question based on the list. Requires `context`",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            context: {
              type: SchemaType.STRING,
            }
          },
          required: ["context"],
        },
      },
      {
        name: "add_to_context",
        description:
          "Adds the provided information to the context. Requires `context`",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            context: {
              type: SchemaType.STRING,
            }
          },
          required: ["context"],
        },
      }
      // {
      //   name: "create_list",
      //   description:
      //     "Creates new list. Requires `id`, `heading`, and `list_array`. May be called multiple times, once for each list you want to create.",
      //   parameters: {
      //     type: SchemaType.OBJECT,
      //     properties: {
      //       id: {
      //         type: SchemaType.STRING,
      //       },
      //       heading: {
      //         type: SchemaType.STRING,
      //       },
      //       list_array: {
      //         type: SchemaType.ARRAY,
      //         items: {
      //           type: SchemaType.STRING,
      //         },
      //       },
      //     },
      //     required: ["id", "heading", "list_array"],
      //   },
      // },
    ],
  },
];

// Chips
const INITIAL_SCREEN_CHIPS = [
  { label: "Looking for a coffee shop", message: "The user is looking for a coffee shop" },
  { label: "Looking for Amy Pavel.", message: "The user is looking for Amy Pavel, who is an assistant professor. User is currently at the entrance of the building." },
];

const LIST_SCREEN_CHIPS = [
  {
    label: " Confirm the goal is achieved",
    message: "",
  },
  {
    label: "✨ Organise into categories",
    message: "Organise it into categories",
  },
  {
    label: "💫 Break into separate lists",
    message: "Break it down into separate lists",
  },
  { label: "🪄 Clear and start again", message: "Clear and start again" },
];

function PlanningComponent() {
  const { client, setConfig, connect, disconnect, connected } = useLiveAPIContext();
  const [responseText, setResponseText] = useState<string | null>("Loading...");
  const { systemState, updateStateOnUserInput, setSystemState } = useSystemStateStore();

  


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
            text: systemState === 'planning' ? PLANNING_SYSTEM_INSTRUCTION : "you are an assistant who always repeat what the user says without any modification",
          },
        ],
      },
      tools: toolObject,
    });
  }, [setConfig, systemState]);

  const [isAwaitingFirstResponse, setIsAwaitingFirstResponse] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [listsState, setListsState] = useState<ListProps[]>([]);
  const [toolResponse, setToolResponse] = useState<ToolResponse | null>(null);

  // Update existing list
  const updateList = useCallback((listId: string, updatedList: string[]) => {
    setListsState((prevLists) =>
      prevLists.map((list) => {
        if (list.id === listId) {
          return { ...list, list_array: updatedList };
        } else {
          return list;
        }
      })
    );
  }, []);

  // Scroll to new list after timeout
  const scrollToList = (id: string) => {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  // Handle checkbox change from List component
  const handleCheckboxChange = useCallback((listId: string, index: number) => {
    setListsState((prevLists) =>
      prevLists.map((list) => {
        if (list.id === listId) {
          const updatedList = [...list.list_array];
          const item = updatedList[index];
          if (item.startsWith("- [ ] ")) {
            updatedList[index] = item.replace("- [ ] ", "- [x] ");
          } else if (item.startsWith("- [x] ")) {
            updatedList[index] = item.replace("- [x] ", "- [ ] ");
          }
          return { ...list, list_array: updatedList };
        }
        return list;
      })
    );
  }, []);


  // FIXME: change system prompt
  // useEffect(() => {
  //   console.log("systemState", systemState);

  //   const handleConnection = async () => {
  //     // disconnect and then connect again
  //     if (connected) {
  //       await disconnect();
  //       console.log("Disconnected");
  //       sleep(1000);
  //       await connect();
  //       console.log("Connected");
  //     }
  //   };
  //   handleConnection();
  // }, [systemState]);

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
              const args = fCall.args as StringArgs;
              const visualQuestion = await visualQuestionGeneration(args.context);
              setResponseText(visualQuestion);
              functionResponse = {
                ...functionResponse,
                response: {
                  result: {
                    string_value: `${fCall.name} OK.`,
                  },
                },
              };
              break;
            }
            case "add_to_context": {
              const args = fCall.args as StringArgs;
              const newList: ListProps = {
                id: "1",
                heading: args.context,
                list_array: [],
                onListUpdate: updateList,
                onCheckboxChange: handleCheckboxChange,
              };
              setListsState((prevLists) => {
                const updatedLists = [...prevLists, newList];
                return updatedLists;
              });
              scrollToList(newList.id);
              
              break;
            }
            case "edit_list": {
              const args = fCall.args as EditListArgs;
              updateList(args.id, args.list_array);
              break;
            }
            case "remove_list": {
              const args = fCall.args as RemoveListArgs;
              setListsState((prevLists) =>
                prevLists.filter((list) => list.id !== args.id)
              );
              break;
            }
            case "create_list": {
              const args = fCall.args as EditListArgs;
              const newList: ListProps = {
                id: args.id,
                heading: args.heading,
                list_array: args.list_array,
                onListUpdate: updateList,
                onCheckboxChange: handleCheckboxChange,
              };
              setListsState((prevLists) => {
                const updatedLists = [...prevLists, newList];
                return updatedLists;
              });
              scrollToList(newList.id);
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
    setIsAwaitingFirstResponse(false);
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, handleCheckboxChange, updateList]);

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
                    object_value: listsState,
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
  }, [toolResponse, listsState, client, setToolResponse]);

  const connectAndSend = async (message: string) => {
    setIsAwaitingFirstResponse(true);
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

  //   Rendered if list length === 0
  const renderInitialScreen = () => {
    return (
      <>
        {/* Hide while connecting to API */}
        {responseText && (
        <div className="response-text">
          <h3>CurrentContext:</h3>
          <p>{responseText}</p>
        </div>
      )}
        
        { systemState == 'planning' && (
          <div className="initial-screen">
            <div className="spacer"></div>
            <h1>Start planning:</h1>
            <input
              type="text"
              value={initialMessage}
              className="initialMessageInput"
              placeholder="type or say something..."
              onChange={(e) => setInitialMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  connectAndSend(`User context: ${initialMessage}`);
                }
              }}
            />
            <div className="spacer"></div>
            <Chips
              title={"Example:"}
              chips={INITIAL_SCREEN_CHIPS}
              onChipClick={(message) => {
                connectAndSend(`User context: ${message}`);
              }}
            />
            <div className="spacer"></div>
          </div>
        )}
      </>
    );
  };

  //   Rendered if list length > 0
  const renderListScreen = () => {
    return (
      <>
      {responseText && (
        <div className="response-text">
          <h3>Generated Visual Question:</h3>
          <p>{responseText}</p>
        </div>
      )}
        <div className="list-screen">
          {listsState.map((listData) => (
            <List
              key={listData.id}
              id={listData.id}
              heading={listData.heading}
              list_array={listData.list_array}
              onListUpdate={updateList}
              onCheckboxChange={handleCheckboxChange}
            />
          ))}
          <Chips
            title={"Try saying:"}
            chips={LIST_SCREEN_CHIPS}
            onChipClick={(message) => {
              client.send({ text: message });
            }}
          />
        </div>
      </>
    );
  };

  return (
    <div className="app">
      {listsState.length === 0 ? renderInitialScreen() : renderListScreen()}
    </div>
  );
}

export const Planning = memo(PlanningComponent);

