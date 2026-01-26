import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InsuranceClaimsService } from './insurance-claims.service';
import { CreateInsuranceClaimDto } from './dto/create-insurance-claim.dto';
import { UpdateInsuranceClaimDto } from './dto/update-insurance-claim.dto';
import { AtGuard } from 'src/auth/guards/at.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';
import { ClaimStatus } from './entities/insurance-claim.entity';

@Controller('insurance-claims')
@UseGuards(AtGuard, RolesGuard)
export class InsuranceClaimsController {
  constructor(
    private readonly insuranceClaimsService: InsuranceClaimsService,
  ) {}

  @Post()
  @Roles(UserRole.REPORTER, UserRole.ADMIN)
  create(
    @Body() createInsuranceClaimDto: CreateInsuranceClaimDto,
    @Request() req: import('src/types/interfaces').RequestWithUser,
  ) {
    return this.insuranceClaimsService.create(
      createInsuranceClaimDto,
      req.user.sub,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSURANCE_AGENT)
  findAll(@Query('status') status?: ClaimStatus) {
    return this.insuranceClaimsService.findAll(status);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.INSURANCE_AGENT)
  getStatistics() {
    return this.insuranceClaimsService.getStatistics();
  }

  @Get('my-claims')
  @Roles(UserRole.REPORTER)
  findMyClaims(@Request() req: import('src/types/interfaces').RequestWithUser) {
    return this.insuranceClaimsService.findByClaimant(req.user.sub);
  }

  @Get('my-assigned-claims')
  @Roles(UserRole.INSURANCE_AGENT)
  findMyAssignedClaims(
    @Request() req: import('src/types/interfaces').RequestWithUser,
  ) {
    return this.insuranceClaimsService.findByInsuranceAgent(req.user.sub);
  }

  @Get('claim-number/:claimNumber')
  findByClaimNumber(@Param('claimNumber') claimNumber: string) {
    return this.insuranceClaimsService.findByClaimNumber(claimNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.insuranceClaimsService.findOne(id);
  }

  @Patch(':id/assign/:agentId')
  @Roles(UserRole.ADMIN, UserRole.INSURANCE_AGENT)
  assignToAgent(@Param('id') id: string, @Param('agentId') agentId: string) {
    return this.insuranceClaimsService.assignToAgent(id, agentId);
  }

  @Patch(':id')
  @Roles(UserRole.INSURANCE_AGENT, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateInsuranceClaimDto: UpdateInsuranceClaimDto,
  ) {
    return this.insuranceClaimsService.update(id, updateInsuranceClaimDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.insuranceClaimsService.remove(id);
  }
}
