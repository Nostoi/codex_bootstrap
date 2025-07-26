import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'ws'

@WebSocketGateway({ port: 8002, path: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server

  sendReminder(message: string) {
    this.server.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'task-reminder', message }))
      }
    })
  }
}
