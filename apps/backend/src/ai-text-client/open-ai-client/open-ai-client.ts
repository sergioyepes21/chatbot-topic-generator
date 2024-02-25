import { AITextClient, AITextClientDefaultResponse } from "../ai-text-client";
import OpenAI from "openai";

export class OpenAIClient implements AITextClient {

  private readonly openAI: OpenAI;

  private readonly defaultModel: string;

  constructor() {
    this.openAI = new OpenAI();
    this.defaultModel = "gpt-3.5-turbo";
  }

  async getAnswer(question: string): Promise<string> {
    return this.sendRequest(question);
  }

  private async sendRequest(question: string): Promise<string> {
    try {
      const completion = await this.openAI.chat.completions.create({
        messages: [
          {
            role: "system",
            content: question,

          }
        ],
        model: this.defaultModel,
      });

      if (completion.choices.length === 0) {
        return AITextClientDefaultResponse.NO_ANSWER;
      }

      const [choice] = completion.choices;

      if (!choice.message.content) {
        return AITextClientDefaultResponse.NO_ANSWER;
      }

      return choice.message.content;
    } catch (error) {
      console.error(error);
      return AITextClientDefaultResponse.ERROR;
    }
  }
}