import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map userId -> Set of socket IDs (user can have multiple tabs)
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.data.userId = userId;
      console.log(`[WS] User ${userId} connected (socket: ${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
      console.log(`[WS] User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  /**
   * Push a notification to a specific user across all their connected tabs/devices.
   */
  sendToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.size > 0) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
      console.log(`[WS] Pushed "${event}" to user ${userId} (${sockets.size} socket(s))`);
    }
  }

  // ─── Real-Time Live Tracking Gateway Channels (Story 3.2) ───

  @SubscribeMessage('subscribe_trip')
  handleSubscribeTrip(client: Socket, payload: { rideId: string }) {
    if (payload?.rideId) {
      const room = `trip_${payload.rideId}`;
      client.join(room);
      console.log(`[WS] Socket ${client.id} joined channel ${room}`);
      client.emit('subscribed_trip_ack', { rideId: payload.rideId, room, status: 'joined' });
    }
  }

  @SubscribeMessage('unsubscribe_trip')
  handleUnsubscribeTrip(client: Socket, payload: { rideId: string }) {
    if (payload?.rideId) {
      const room = `trip_${payload.rideId}`;
      client.leave(room);
      console.log(`[WS] Socket ${client.id} left channel ${room}`);
    }
  }

  @SubscribeMessage('update_location')
  handleUpdateLocation(
    client: Socket,
    payload: {
      rideId: string;
      lat: number;
      lng: number;
      bearing?: number;
      speed?: number;
      etaMinutes?: number;
      remainingKm?: number;
    },
  ) {
    if (payload?.rideId) {
      const room = `trip_${payload.rideId}`;
      const data = {
        ...payload,
        timestamp: new Date().toISOString(),
      };
      this.server.to(room).emit('location_updated', data);
      console.log(`[WS] Location update broadcast to channel ${room}: lat ${payload.lat}, lng ${payload.lng}`);
    }
  }

  @SubscribeMessage('update_trip_state')
  handleUpdateTripState(
    client: Socket,
    payload: { rideId: string; tripState: string; note?: string },
  ) {
    if (payload?.rideId && payload?.tripState) {
      const room = `trip_${payload.rideId}`;
      const data = {
        ...payload,
        timestamp: new Date().toISOString(),
      };
      this.server.to(room).emit('trip_state_updated', data);
      console.log(`[WS] Trip state updated broadcast to channel ${room}: ${payload.tripState}`);
    }
  }

  /**
   * Broadcast an event to all subscribers of a specific trip channel.
   */
  broadcastToTrip(rideId: string, event: string, data: any) {
    const room = `trip_${rideId}`;
    this.server.to(room).emit(event, data);
    console.log(`[WS] Broadcasted "${event}" to channel ${room}`);
  }
}
