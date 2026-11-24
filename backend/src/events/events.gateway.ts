import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('Socket.IO Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastListingCreated(listing: any) {
    this.server.emit('listing:created', listing);
  }

  broadcastListingUpdated(listing: any) {
    this.server.emit('listing:updated', listing);
  }

  broadcastListingClaimed(payload: { listingId: string; listing: any; claim: any }) {
    this.server.emit('listing:claimed', payload);
  }

  broadcastListingCollected(payload: { listingId: string; listing: any; claim: any }) {
    this.server.emit('listing:collected', payload);
  }

  broadcastListingExpired(payload: { listingId: string }) {
    this.server.emit('listing:expired', payload);
  }

  broadcastNotification(notification: any) {
    this.server.emit('notification:new', notification);
  }
}

