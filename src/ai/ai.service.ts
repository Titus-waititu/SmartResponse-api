import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
   * Analyze accident images using Google Gemini Vision to determine severity
   */
  async analyzeAccidentSeverity(
    imageUrls: string[],
  ): Promise<SeverityAnalysisResult> {
    try {
      this.logger.log(
        `Analyzing ${imageUrls.length} images for accident severity`,
      );

      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
        this.logger.warn('Gemini API key not configured, using mock analysis');
        return this.getMockAnalysis();
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Fetch images and convert to base64
      const imageParts = await Promise.all(
        imageUrls.map(async (url) => {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          return {
            inlineData: {
              data: base64,
              mimeType,
            },
          };
        }),
      );

      const prompt = `Analyze this accident scene and provide a JSON response with the following structure:
{
  "severity": <number from 0-100>,
  "analysis": "<detailed analysis>",
  "detectedInjuries": ["<injury1>", "<injury2>"],
  "vehicleDamage": "<damage description>",
  "recommendedServices": ["<service1>", "<service2>"]
}

Assess the severity of the accident, identify visible injuries, describe vehicle damage, and recommend appropriate emergency services (e.g., police, ambulance, fire department).`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = result.response;
      const text = response.text();

      // Extract JSON from markdown code blocks if present
      let jsonText = text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonText) as {
        severity?: number;
        analysis?: string;
        detectedInjuries?: string[];
        vehicleDamage?: string;
        recommendedServices?: string[];
      };

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  detectVehicleDamage(imageUrl: string): Promise<string[]> {
    // TODO: Implement vehicle damage detection
    return Promise.resolve([
      'Front bumper damaged',
      'Hood deformed',
      'Windshield cracked',
    ]);
  }

  /**
   * Detect potential injuries from scene
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  detectPotentialInjuries(imageUrl: string): Promise<boolean> {
    // TODO: Implement injury detection
    return Promise.resolve(true);
  }

  /**
   * Identify hazards in accident scene
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  identifyHazards(imageUrl: string): Promise<string[]> {
    // TODO: Implement hazard detection
    return Promise.resolve(['Fuel leak', 'Sharp debris', 'Exposed wiring']);
  }

  /**
   * Generate AI-powered accident report summary
   */
  generateAccidentSummary(accidentData: {
    locationAddress: string;
    severity: string;
    numberOfVehicles: number;
    numberOfInjuries: number;
    weatherConditions: string;
    roadConditions: string;
  }): Promise<{ summary: string; keyPoints: string[] }> {
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

      return Promise.resolve({ summary: summary.trim(), keyPoints });
    } catch (error) {
      this.logger.error('Error generating accident summary', error);
      throw error;
    }
  }
}
