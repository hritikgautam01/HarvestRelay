import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { DatabaseService } from '../database/database.service';
import { EventsGateway } from '../events/events.gateway';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, DatabaseService, EventsGateway],
  exports: [ListingsService],
})
export class ListingsModule {}

