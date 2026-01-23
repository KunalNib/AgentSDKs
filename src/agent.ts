import "dotenv/config";
import {
  FunctionTool,
  LlmAgent,
  Runner,
  InMemorySessionService,
  AgentTool,
  LoopAgent
} from "@google/adk";
import { z } from "zod";
import axios from "axios";
const sessionService = new InMemorySessionService();

const getCurrentTime = new FunctionTool({
  name: "get_current_time",
  description: "Returns the current time.",
  parameters: z.object({}),
  execute: () => {
    return Date.now().toString();
  },
});


const taskComplete = new FunctionTool({
  name: "task_complete",
  description: "Signals that the user's request has been fully satisfied. Use this to end the session.",
  parameters: z.object({
    summary: z.string().describe("Final summary of actions taken"),
  }),
  execute: async ({ summary }) => {
    return `GOAL_REACHED: ${summary}`;
  },
});

const getWeatherDataByCity = new FunctionTool({
  name: "get_weather_data_by_city",
  description: "Returns the current weather data about the city",
  parameters: z.object({
    cityname: z.string().describe("Name of City"),
  }),
  execute: async ({ cityname }) => {
    const url = `https://wttr.in/${cityname.toLowerCase()}`;
    const { data } = await axios.get(url, { responseType: "text" });
    return `The current Weather of ${cityname} is ${data} `;
  },
});

const COOK = new LlmAgent({
  name: "Cook",
  model: "gemini-2.5-flash",
  description: "cooking assistant",
  instruction:
    "you are cooking assistant who helps the people in cooking according to their queries and helps them in making dishes and assist them in suggestions",
  tools: [getCurrentTime, getWeatherDataByCity,taskComplete],
});

 const codingAgent = new LlmAgent({
  name: "coding_agent",
  model: "gemini-2.5-flash",
  description: "coding assistant",
  instruction:`you are a coding assistant you only answer coding questions and help people in solving coding problems`,
  tools: [new AgentTool({ agent: COOK }),taskComplete],
});

const chatAgent = new LlmAgent({
  name: "chat_Agent",
  model: "gemini-2.5-flash",
    description: "chat Agent",
    instruction:`Respond casually. If you have answered the user fully, call "task_complete".`,
    tools:[taskComplete],
});



 const triageAgent = new LlmAgent({
  name: "Triage_Agent",
  model: "gemini-2.5-flash",
  description: "Triage Agent",
  instruction:  `
You are the Project Manager. Analyze the user's request. 
If it is a multi-step task (e.g., "Get weather and then write code"):
1. Call the 'Cook' tool first to gather environmental/food data.
2. Once Cook is done, DO NOT END. Review the Cook's output.
3. Call 'coding_agent' and provide the Cook's data to it for the next step.
4. Only call 'taskComplete' when the final deliverable is ready.

`,
  subAgents: [codingAgent, COOK,chatAgent],
  tools:[new AgentTool({ agent: COOK }),new AgentTool({ agent: chatAgent }),new AgentTool({ agent: codingAgent }),taskComplete]
});



export const orchestratedSystem = new LoopAgent({
  name: "Collaborative_System",
  // This will cycle through agents until they call a 'task_complete' tool
  subAgents: [triageAgent], 
  maxIterations: 5,
  
});


// const runner = new Runner({
//   appName: "cook-agent",
//   agent: COOK,
//   sessionService: sessionService,
// });

// async function main() {

//   const sessionId = "user1";
//   const userId = "user";
//   const appName = "cook-agent";

//   await runner.sessionService.createSession({
//     appName: appName,
//     userId: userId,
//     sessionId: sessionId
//   });
//   const res = await runner.runAsync({
//     sessionId: "user1",
//     userId: "user",
//     newMessage: {
//       role: 'user',
//       parts: [{
//         text: "what food is the best  to eat at this time in this weather in Nagpur"
//       }]
//     }
//   });

//   for await (const event of res) {
//     if (event.content && event.content.parts) {
//        console.log(event.content?.parts[0]?.text);
//     }
//   }
// }

// main();
