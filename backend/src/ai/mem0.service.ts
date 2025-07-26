import { Injectable } from '@nestjs/common'

@Injectable()
export class Mem0Service {
  async storeInteraction(text: string): Promise<void> {
    await fetch(`${process.env.MEM0_URL}/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MEM0_API_KEY}`,
      },
      body: JSON.stringify({ text }),
    })
  }

  async search(query: string): Promise<string[]> {
    const res = await fetch(`${process.env.MEM0_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MEM0_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    })
    const data = await res.json()
    return data.results || []
  }
}
