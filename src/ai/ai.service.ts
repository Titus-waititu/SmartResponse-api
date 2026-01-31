import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface SeverityAnalysisResult {
  severity: number; // 0-100 severity score
  analysis: string;
  detectedInjuries: string[];
  vehicleDamage: string;
  recommendedServices: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Analyze accident images using OpenAI Vision to determine severity
   */
  async analyzeAccidentSeverity(
    imageUrls: string[],
  ): Promise<SeverityAnalysisResult> {
    try {
      this.logger.log(
        `Analyzing ${imageUrls.length} images for accident severity`,
      );

      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        this.logger.warn('OpenAI API key not configured, using mock analysis');
        return this.getMockAnalysis();
      }

      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this accident scene and provide: 1) Severity score (0-100), 2) Detailed analysis, 3) Detected injuries, 4) Vehicle damage description, 5) Recommended emergency services. Format response as JSON.',
              },
              ...imageUrls.map((url) => ({
                type: 'image_url' as const,
                image_url: { url },
              })),
            ],
          },
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        severity: parsed.severity || 50,
        analysis: parsed.analysis || 'Unable to analyze',
        detectedInjuries: parsed.detectedInjuries || [],
        vehicleDamage: parsed.vehicleDamage || 'Unknown',
        recommendedServices: parsed.recommendedServices || ['police'],
      };
    } catch (error) {
      this.logger.error('Error analyzing accident severity', error);
      return this.getMockAnalysis();
    }
  }

  private getMockAnalysis(): SeverityAnalysisResult {
    return {
      severity: 65,
      analysis: 'Moderate collision detected with visible vehicle damage',
      detectedInjuries: ['possible minor injuries'],
      vehicleDamage: 'Front-end damage visible',
      recommendedServices: ['police', 'ambulance'],
    };
  }

  /**
   * Analyze specific aspects of accident images
   */
  async detectVehicleDamage(imageUrl: string): Promise<string[]> {
    // TODO: Implement vehicle damage detection
    return ['Front bumper damaged', 'Hood deformed', 'Windshield cracked'];
  }

  /**
   * Detect potential injuries from scene
   */
  async detectPotentialInjuries(imageUrl: string): Promise<boolean> {
    // TODO: Implement injury detection
    return true;
  }

  /**
   * Identify hazards in accident scene
   */
  async identifyHazards(imageUrl: string): Promise<string[]> {
    // TODO: Implement hazard detection
    return ['Fuel leak', 'Sharp debris', 'Exposed wiring'];
  }

  /**
   * Generate AI-powered accident report summary
   */
  async generateAccidentSummary(
    accidentData: any,
  ): Promise<{ summary: string; keyPoints: string[] }> {
    try {
      // TODO: Integrate with GPT-4 or similar for report generation
      const summary = `
        Accident reported at ${accidentData.locationAddress}.
        Severity: ${accidentData.severity}.
        ${accidentData.numberOfVehicles} vehicle(s) involved.
        ${accidentData.numberOfInjuries} injury/injuries reported.
        Weather conditions: ${accidentData.weatherConditions}.
        Road conditions: ${accidentData.roadConditions}.
      `;

      const keyPoints = [
        `Location: ${accidentData.locationAddress}`,
        `Severity: ${accidentData.severity}`,
        `Vehicles: ${accidentData.numberOfVehicles}`,
        `Injuries: ${accidentData.numberOfInjuries}`,
      ];

      return { summary: summary.trim(), keyPoints };
    } catch (error) {
      this.logger.error('Error generating accident summary', error);
      throw error;
    }
  }
}
