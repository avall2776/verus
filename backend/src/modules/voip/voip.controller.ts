import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { VoipService } from './voip.service';
import { OriginateCallDto } from './dto/originate-call.dto';
import { UpdateVoipConfigDto } from './dto/update-voip-config.dto';
import { HangupCallDto } from './dto/hangup-call.dto';
import { DtmfCallDto } from './dto/dtmf-call.dto';
import { TransferCallDto } from './dto/transfer-call.dto';

@UseGuards(JwtAuthGuard)
@Controller('voip')
export class VoipController {
  constructor(private readonly voipService: VoipService) {}

  @Get('config')
  async getConfig(@Request() req) {
    return this.voipService.getConfig();
  }

  @Post('config')
  async updateConfig(@Request() req, @Body() dto: UpdateVoipConfigDto) {
    return this.voipService.updateConfig(dto);
  }

  @Post('call/originate')
  async originateCall(@Request() req, @Body() dto: OriginateCallDto) {
    return this.voipService.originateCall(dto);
  }

  @Post('call/hangup')
  async hangupCall(@Request() req, @Body() dto: HangupCallDto) {
    return this.voipService.hangupCall(dto);
  }

  @Post('call/dtmf')
  async sendDtmf(@Request() req, @Body() dto: DtmfCallDto) {
    return this.voipService.sendDtmf(dto);
  }

  @Post('call/hold/:id')
  async toggleHold(@Request() req, @Param('id') id: string) {
    return this.voipService.toggleHold(id);
  }

  @Post('call/transfer')
  async transferCall(@Request() req, @Body() dto: TransferCallDto) {
    return this.voipService.transferCall(dto);
  }

  @Get('calls/active')
  async getActiveCalls(@Request() req) {
    return this.voipService.getActiveCalls();
  }

  @Get('calls/history')
  async getCallHistory(@Request() req) {
    return this.voipService.getCallHistory();
  }

  @Get('test-connection')
  async testConnection(@Request() req) {
    return this.voipService.testConnection();
  }
}
