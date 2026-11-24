import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { DatabaseService } from '../database/database.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, DatabaseService],
  exports: [AdminService],
})
export class AdminModule {}

