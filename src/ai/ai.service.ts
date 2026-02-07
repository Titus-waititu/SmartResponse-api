import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

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
   * Analyze accident images using Google Gemini 1.5 Flash
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
      
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: "application/json",
        }
      });

      const imageParts = await Promise.all(
        imageUrls.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              this.logger.warn(`Failed to fetch image from ${url}: ${response.status}`);
              return null;
            }
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/jpeg';
            return {
              inlineData: {
                data: base64,
                mimeType,
              },
            };
          } catch (error) {
            this.logger.warn(`Error fetching image from ${url}:`, error.message);
            return null;
          }
        }),
      );

      const validImageParts = imageParts.filter((part) => part !== null);

      if (validImageParts.length === 0) {
        this.logger.warn('No valid images could be fetched, using mock analysis');
        return this.getMockAnalysis();
      }

      // Prompt simplified because responseMimeType: "application/json" is set above
      const prompt = `Analyze these accident scene images and provide a JSON response with the following keys:
      "severity" (number 0-100),
      "analysis" (detailed string),
      "detectedInjuries" (array of strings),
      "vehicleDamage" (string description),
      "recommendedServices" (array of strings e.g. police, ambulance).
      
      Focus on visible structural damage to vehicles and any signs of medical distress.`;

      const result = await model.generateContent([prompt, ...validImageParts]);
      const response = result.response;
      const text = response.text();

      // Since we used responseMimeType: "application/json", we don't need regex logic
      const parsed = JSON.parse(text) as SeverityAnalysisResult;

      return {
        severity: parsed.severity ?? 50,
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
      analysis: 'Moderate collision detected with visible vehicle damage (Mock)',
      detectedInjuries: ['possible minor injuries'],
      vehicleDamage: 'Front-end damage visible',
      recommendedServices: ['police', 'ambulance'],
    };
  }

  // ... rest of your methods remain the same ...
  
  generateAccidentSummary(accidentData: any): Promise<{ summary: string; keyPoints: string[] }> {
      const summary = `Accident reported at ${accidentData.locationAddress}. Severity: ${accidentData.severity}.`;
      const keyPoints = [`Location: ${accidentData.locationAddress}`];
      return Promise.resolve({ summary, keyPoints });
  }
}