import "dotenv/config";
import { FunctionTool, LlmAgent, Runner, InMemorySessionService, } from "@google/adk";
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
    instruction: "you are cooking assistant who helps the people in cooking according to their queries and helps them in making dishes and assist them in suggestions",
    tools: [getCurrentTime, getWeatherDataByCity],
});
const codingAgent = new LlmAgent({
    name: "coding_agent",
    model: "gemini-2.5-flash",
    description: "coding assistant",
    instruction: `you are a coding assistant you only answer coding questions and help people in solving coding problems`,
    tools: [],
});
const chatAgent = new LlmAgent({
    name: "chat_Agent",
    model: "gemini-2.5-flash",
    description: "chat Agent",
    instruction: 'you are chatting agent you casual chat with user',
});
export const triageAgent = new LlmAgent({
    name: "Triage_Agent",
    model: "gemini-2.5-flash",
    description: "Triage Agent",
    instruction: `
You are a routing agent. 
    Analyze the user's query and use the transfer tools to send the user to the right expert.
    - Food/Cooking/Weather -> Transfer to Cook
    - Programming/Code -> Transfer to coding_agent
    - Casual Chat -> Transfer to chat_Agent
`,
    subAgents: [codingAgent, COOK, chatAgent],
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
//# sourceMappingURL=agent.js.map