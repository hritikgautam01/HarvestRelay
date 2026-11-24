import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ListingsService } from '../listings/listings.service';

@Injectable()
export class ExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExpiryService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private listingsService: ListingsService) {}

  onModuleInit() {
    this.logger.log('Starting automated surplus food expiry monitor (runs every 30s)...');
    this.timer = setInterval(async () => {
      try {
        await this.listingsService.checkAndExpireListings();
      } catch (err) {
        this.logger.error(`Error during expiry check: ${(err as Error).message}`);
      }
    }, 30000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

