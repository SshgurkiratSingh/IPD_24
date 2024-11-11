export interface ChatMessage {
  type: "user" | "assistant";
  text: string;
  data?: AssistantData;
}

export interface AssistantData {
  reply: string;
  update: any[];
  contextNeed: any[];
  suggestedQuestions: string[];
  scheduleTask: any;
}

export interface Action {
  mqttTopic: string;
  value: string;
}