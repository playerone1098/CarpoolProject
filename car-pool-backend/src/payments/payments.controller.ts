import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentHoldDto } from './dto/create-payment-hold.dto';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('hold')
  createHold(@Body() dto: CreatePaymentHoldDto, @Req() req: any) {
    const riderId = req.user?.userId;
    return this.paymentsService.createHold(riderId, dto);
  }

  @Post('topup')
  topUpWallet(@Body() dto: TopUpWalletDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.paymentsService.topUpWallet(userId, dto.amount);
  }

  @Post('end-trip')
  completeTrip(
    @Body() body: { rideId: string; cashConfirmed?: boolean },
    @Req() req: any,
  ) {
    const driverId = req.user?.userId;
    return this.paymentsService.completeTripAndSettle(
      body.rideId,
      driverId,
      body.cashConfirmed ?? false,
    );
  }

  @Get('ledger')
  getDriverLedger(@Req() req: any) {
    const driverId = req.user?.userId;
    return this.paymentsService.getDriverLedger(driverId);
  }

  @Get('wallet')
  getWalletInfo(@Req() req: any) {
    const userId = req.user?.userId;
    return this.paymentsService.getWalletInfo(userId);
  }

  @Get('receipt/:paymentId')
  getReceipt(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getReceipt(paymentId);
  }
}
