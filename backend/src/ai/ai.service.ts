import { Injectable } from '@nestjs/common'

@Injectable()
export class AiService {
  constructor() {}

  async generateTasks(prompt: string): Promise<string[]> {
    const res = await this.request(prompt)
    const content = res || ''
    return content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  }

  async summarize(text: string): Promise<string> {
    return this.request(`Summarize the following text:\n${text}`)
  }

  private async request(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ''
  }
}
