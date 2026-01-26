import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateInsuranceClaimDto {
  @IsString()
  @IsNotEmpty()
  accident_report_id: string;

  @IsString()
  @IsNotEmpty()
  insurance_company: string;

  @IsString()
  @IsNotEmpty()
  policy_number: string;

  @IsNumber()
  @Min(0)
  estimated_damage_cost: number;

  @IsString()
  @IsOptional()
  description?: string;
}
