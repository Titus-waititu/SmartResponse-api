import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceClaimsService } from './insurance-claims.service';
import { InsuranceClaimsController } from './insurance-claims.controller';
import { InsuranceClaim } from './entities/insurance-claim.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InsuranceClaim])],
  controllers: [InsuranceClaimsController],
  providers: [InsuranceClaimsService],
  exports: [InsuranceClaimsService],
})
export class InsuranceClaimsModule {}
