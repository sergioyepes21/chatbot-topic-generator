
export interface AITextClient {
  getAnswer(question: string): Promise<string>;
}

export enum AITextClientDefaultResponse {
  NO_ANSWER = "No answer found",
  ERROR = "Error"
}