import 'dotenv/config'
import {FunctionTool,LlmAgent} from '@google/adk';
import {z} from 'zod';
import axios from 'axios';


const getCurrentTime = new FunctionTool({
  name: 'get_current_time',
  description: 'Returns the current time.',
  parameters: z.object({
  }),
  execute: () => {
    return Date.now().toString();
  },
});

const getWeatherDataByCity=new FunctionTool( {
  name:'get_weather_data_by_city',
  description:'Returns the current weather data about the city',
  parameters:z.object({
    cityname:z.string().describe("Name of City"),
  }),
  execute:async ({cityname})=>{
    const url=`https://wttr.in/${cityname.toLowerCase()}`;
    const {data}= await axios.get(url,{responseType:'text'});
    return `The current Weather of ${cityname} is ${data} `;
  }

})

export const rootAgent=new LlmAgent({
    name:"Cook",
    model:'gemini-2.5-flash',
    description:'cooking assistant',
    instruction:'you are cooking assistant who helps the people in cooking according to their queries and helps them in making dishes and assist them in suggestions',
    tools:[getCurrentTime,getWeatherDataByCity]
})

