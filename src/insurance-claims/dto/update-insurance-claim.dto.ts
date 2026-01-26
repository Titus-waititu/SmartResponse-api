import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ClaimStatus } from '../entities/insurance-claim.entity';

export class UpdateInsuranceClaimDto {
  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  approved_amount?: number;

  @IsString()
  @IsOptional()
  rejection_reason?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
