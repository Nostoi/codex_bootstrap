import { Injectable } from "@nestjs/common";
import { Mem0Service } from "./mem0.service";

@Injectable()
export class AiService {
  constructor(private readonly mem0: Mem0Service) {}

  async generateTasks(prompt: string): Promise<string[]> {
    const context = await this.mem0.search(prompt);
    const res = await this.request(`${context.join("\n")}\n${prompt}`);
    await this.mem0.storeInteraction(prompt);
    const content = res || "";
    return content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async getSuggestions(context: string): Promise<string[]> {
    const history = await this.mem0.search(context);
    const prompt = `Based on the following interaction history:\n${history.join("\n")}\nSuggest next tasks for: ${context}`;
    const res = await this.request(prompt);
    await this.mem0.storeInteraction(context);
    return res
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async summarize(text: string): Promise<string> {
    await this.mem0.storeInteraction(text);
    return this.request(`Summarize the following text:\n${text}`);
  }

  private async request(prompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}
