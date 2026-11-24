import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { DatabaseService } from '../database/database.service';
import { EventsGateway } from '../events/events.gateway';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, DatabaseService, EventsGateway],
  exports: [ClaimsService],
})
export class ClaimsModule {}

