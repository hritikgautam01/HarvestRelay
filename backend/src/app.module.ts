import { Module } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { EventsGateway } from './events/events.gateway';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { ClaimsModule } from './claims/claims.module';
import { AdminModule } from './admin/admin.module';
import { SeedService } from './seed/seed.service';
import { ExpiryService } from './expiry/expiry.service';

@Module({
  imports: [AuthModule, ListingsModule, ClaimsModule, AdminModule],
  providers: [DatabaseService, EventsGateway, SeedService, ExpiryService],
})
export class AppModule {}
