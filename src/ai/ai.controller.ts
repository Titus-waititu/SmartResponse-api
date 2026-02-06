import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types';
import { RolesGuard } from '../auth/guards/roles.guard';

class AnalyzeAccidentDto {
  accidentId: string;
  description: string;
  severity?: string;
  weatherConditions?: string;
  roadConditions?: string;
  numberOfVehicles: number;
  numberOfInjuries: number;
  images?: string[];
}

class GenerateReportDto {
  accidentId: string;
  includeAnalysis?: boolean;
  includeRecommendations?: boolean;
}

class ExtractTextDto {
  imageUrl: string;
}

class ClassifySeverityDto {
  description: string;
  numberOfVehicles: number;
  numberOfInjuries: number;
  numberOfFatalities: number;
  weatherConditions?: string;
  roadConditions?: string;
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-accident')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Analyze accident with AI' })
  @ApiBody({ type: AnalyzeAccidentDto })
  @ApiResponse({
    status: 200,
    description: 'Accident analyzed successfully',
  })
  async analyzeAccident(@Body() dto: AnalyzeAccidentDto) {
    const images = dto.images || [];
    const severityAnalysis =
      await this.aiService.analyzeAccidentSeverity(images);

    return {
      accidentId: dto.accidentId,
      aiAnalysis: severityAnalysis,
      inputData: {
        description: dto.description,
        weatherConditions: dto.weatherConditions,
        roadConditions: dto.roadConditions,
        numberOfVehicles: dto.numberOfVehicles,
        numberOfInjuries: dto.numberOfInjuries,
      },
    };
  }

  @Post('generate-report')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Generate accident report with AI' })
  @ApiBody({ type: GenerateReportDto })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
  })
  generateReport(@Body() dto: GenerateReportDto) {
    // TODO: Implement AI report generation
    return {
      accidentId: dto.accidentId,
      report: 'AI-generated report content',
      includeAnalysis: dto.includeAnalysis,
      includeRecommendations: dto.includeRecommendations,
      generatedAt: new Date(),
    };
  }

  @Post('extract-text')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Extract text from image (OCR)' })
  @ApiBody({ type: ExtractTextDto })
  @ApiResponse({
    status: 200,
    description: 'Text extracted successfully',
  })
  extractText(@Body() dto: ExtractTextDto) {
    // TODO: Implement OCR functionality
    return {
      imageUrl: dto.imageUrl,
      extractedText: 'License plate: ABC-123',
      confidence: 0.95,
    };
  }

  @Post('classify-severity')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Classify accident severity' })
  @ApiBody({ type: ClassifySeverityDto })
  @ApiResponse({
    status: 200,
    description: 'Severity classified successfully',
  })
  classifySeverity(@Body() dto: ClassifySeverityDto) {
    // Simple severity classification based on inputs
    let severity = 0;

    // Base severity from vehicles and injuries
    severity += dto.numberOfVehicles * 10;
    severity += dto.numberOfInjuries * 20;
    severity += dto.numberOfFatalities * 50;

    // Adjust for conditions
    if (dto.weatherConditions?.toLowerCase().includes('rain')) severity += 10;
    if (dto.weatherConditions?.toLowerCase().includes('snow')) severity += 15;
    if (dto.roadConditions?.toLowerCase().includes('wet')) severity += 5;
    if (dto.roadConditions?.toLowerCase().includes('icy')) severity += 10;

    severity = Math.min(severity, 100);

    let classification = 'low';
    if (severity > 70) classification = 'critical';
    else if (severity > 50) classification = 'high';
    else if (severity > 30) classification = 'moderate';

    return {
      severity,
      classification,
      requiresEmergencyServices: severity > 50,
      recommendedServices:
        severity > 70
          ? ['ambulance', 'fire', 'police']
          : severity > 50
            ? ['ambulance', 'police']
            : severity > 30
              ? ['police']
              : [],
    };
  }

  @Get('insights/:accidentId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.EMERGENCY_RESPONDER)
  @ApiOperation({ summary: 'Get AI insights for accident' })
  @ApiResponse({
    status: 200,
    description: 'AI insights retrieved successfully',
  })
  getInsights(@Param('accidentId', ParseUUIDPipe) accidentId: string) {
    // TODO: Fetch accident data and generate insights
    return {
      accidentId,
      insights: [
        'High-impact collision detected',
        'Multiple vehicles involved',
        'Emergency services recommended',
      ],
      riskFactors: ['Weather conditions', 'Time of day', 'Traffic density'],
      similarIncidents: 3,
      predictionAccuracy: 0.87,
    };
  }
}
