import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceClaim, ClaimStatus } from './entities/insurance-claim.entity';
import { CreateInsuranceClaimDto } from './dto/create-insurance-claim.dto';
import { UpdateInsuranceClaimDto } from './dto/update-insurance-claim.dto';

@Injectable()
export class InsuranceClaimsService {
  constructor(
    @InjectRepository(InsuranceClaim)
    private insuranceClaimRepository: Repository<InsuranceClaim>,
  ) {}

  private generateClaimNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CLM-${timestamp}-${random}`;
  }

  async create(
    createInsuranceClaimDto: CreateInsuranceClaimDto,
    claimantId: string,
  ): Promise<InsuranceClaim> {
    try {
      const claimNumber = this.generateClaimNumber();
      const newClaim = this.insuranceClaimRepository.create({
        ...createInsuranceClaimDto,
        claim_number: claimNumber,
        accident_report: {
          id: createInsuranceClaimDto.accident_report_id,
        } as any,
        claimant: { id: claimantId } as any,
      });
      return await this.insuranceClaimRepository.save(newClaim);
    } catch (error) {
      throw new Error('Error creating insurance claim: ' + error.message);
    }
  }

  async findAll(status?: ClaimStatus): Promise<InsuranceClaim[]> {
    const query = this.insuranceClaimRepository
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.accident_report', 'accident_report')
      .leftJoinAndSelect('claim.claimant', 'claimant')
      .leftJoinAndSelect('claim.insurance_agent', 'insurance_agent')
      .orderBy('claim.submitted_at', 'DESC');

    if (status) {
      query.andWhere('claim.status = :status', { status });
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<InsuranceClaim> {
    const claim = await this.insuranceClaimRepository.findOne({
      where: { id },
      relations: ['accident_report', 'claimant', 'insurance_agent'],
    });

    if (!claim) {
      throw new Error(`Insurance claim with ID ${id} not found`);
    }

    return claim;
  }

  async findByClaimNumber(claimNumber: string): Promise<InsuranceClaim> {
    const claim = await this.insuranceClaimRepository.findOne({
      where: { claim_number: claimNumber },
      relations: ['accident_report', 'claimant', 'insurance_agent'],
    });

    if (!claim) {
      throw new Error(`Insurance claim with number ${claimNumber} not found`);
    }

    return claim;
  }

  async findByClaimant(claimantId: string): Promise<InsuranceClaim[]> {
    return await this.insuranceClaimRepository.find({
      where: { claimant: { id: claimantId } },
      relations: ['accident_report', 'insurance_agent'],
      order: { submitted_at: 'DESC' },
    });
  }

  async findByInsuranceAgent(agentId: string): Promise<InsuranceClaim[]> {
    return await this.insuranceClaimRepository.find({
      where: { insurance_agent: { id: agentId } },
      relations: ['accident_report', 'claimant'],
      order: { submitted_at: 'DESC' },
    });
  }

  async assignToAgent(
    claimId: string,
    agentId: string,
  ): Promise<InsuranceClaim> {
    await this.insuranceClaimRepository.update(claimId, {
      insurance_agent: { id: agentId } as any,
      status: ClaimStatus.UNDER_REVIEW,
    });
    return await this.findOne(claimId);
  }

  async update(
    id: string,
    updateInsuranceClaimDto: UpdateInsuranceClaimDto,
  ): Promise<InsuranceClaim> {
    const claim = await this.findOne(id);

    const updateData: any = { ...updateInsuranceClaimDto };

    if (
      updateInsuranceClaimDto.status === ClaimStatus.APPROVED ||
      updateInsuranceClaimDto.status === ClaimStatus.REJECTED ||
      updateInsuranceClaimDto.status === ClaimStatus.PAID
    ) {
      updateData.processed_at = new Date();
    }

    await this.insuranceClaimRepository.update(id, updateData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.insuranceClaimRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Insurance claim with ID ${id} not found`);
    }
    return { message: `Insurance claim with ID ${id} successfully deleted` };
  }

  async getStatistics(): Promise<any> {
    const [
      totalClaims,
      submittedClaims,
      underReviewClaims,
      approvedClaims,
      rejectedClaims,
      paidClaims,
      totalEstimatedCost,
      totalApprovedAmount,
    ] = await Promise.all([
      this.insuranceClaimRepository.count(),
      this.insuranceClaimRepository.count({
        where: { status: ClaimStatus.SUBMITTED },
      }),
      this.insuranceClaimRepository.count({
        where: { status: ClaimStatus.UNDER_REVIEW },
      }),
      this.insuranceClaimRepository.count({
        where: { status: ClaimStatus.APPROVED },
      }),
      this.insuranceClaimRepository.count({
        where: { status: ClaimStatus.REJECTED },
      }),
      this.insuranceClaimRepository.count({
        where: { status: ClaimStatus.PAID },
      }),
      this.insuranceClaimRepository
        .createQueryBuilder('claim')
        .select('SUM(claim.estimated_damage_cost)', 'total')
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
      this.insuranceClaimRepository
        .createQueryBuilder('claim')
        .select('SUM(claim.approved_amount)', 'total')
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
    ]);

    return {
      totalClaims,
      statusBreakdown: {
        submitted: submittedClaims,
        underReview: underReviewClaims,
        approved: approvedClaims,
        rejected: rejectedClaims,
        paid: paidClaims,
      },
      financialSummary: {
        totalEstimatedCost,
        totalApprovedAmount,
        approvalRate:
          totalClaims > 0
            ? ((approvedClaims + paidClaims) / totalClaims) * 100
            : 0,
      },
    };
  }
}
