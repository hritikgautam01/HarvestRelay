import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/claims')
@UseGuards(AuthGuard)
export class ClaimsController {
  constructor(private claimsService: ClaimsService) {}

  @Roles('RECIPIENT', 'ADMIN')
  @Post(':listingId')
  async claimListing(
    @Req() req: any,
    @Param('listingId') listingId: string,
    @Body() body: any
  ) {
    return this.claimsService.claimListing(req.user.id, listingId, body);
  }

  @Post(':claimId/handover')
  async confirmHandover(
    @Req() req: any,
    @Param('claimId') claimId: string,
    @Body('handover_pin') handoverPin: string
  ) {
    return this.claimsService.confirmHandover(
      req.user.id,
      req.user.role,
      claimId,
      handoverPin
    );
  }

  @Post(':claimId/cancel')
  async cancelClaim(
    @Req() req: any,
    @Param('claimId') claimId: string,
    @Body('reason') reason?: string
  ) {
    return this.claimsService.cancelClaim(
      req.user.id,
      req.user.role,
      claimId,
      reason
    );
  }

  @Get('my-claims')
  async getMyClaims(@Req() req: any) {
    return this.claimsService.getMyClaims(req.user.id);
  }

  @Get('vendor-claims')
  async getVendorClaims(@Req() req: any) {
    return this.claimsService.getVendorClaims(req.user.id);
  }
}

