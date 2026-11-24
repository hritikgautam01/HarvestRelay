import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get()
  async getListings(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('dietary') dietary?: string,
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: string
  ) {
    return this.listingsService.getAllListings({
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      category,
      status,
      dietary,
      search,
      vendorId,
    });
  }

  @Get(':id')
  async getListing(@Param('id') id: string) {
    return this.listingsService.getListingById(id);
  }

  @UseGuards(AuthGuard)
  @Roles('VENDOR', 'ADMIN')
  @Post()
  async createListing(@Req() req: any, @Body() body: any) {
    return this.listingsService.createListing(req.user.id, body);
  }

  @UseGuards(AuthGuard)
  @Roles('VENDOR', 'ADMIN')
  @Put(':id')
  async updateListing(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.listingsService.updateListing(id, req.user.id, body);
  }

  @UseGuards(AuthGuard)
  @Post(':id/close')
  async closeListing(@Req() req: any, @Param('id') id: string) {
    return this.listingsService.closeListing(id, req.user.id, req.user.role);
  }

  @Post('reset-timers')
  async resetTimers() {
    return this.listingsService.resetTimers();
  }
}

