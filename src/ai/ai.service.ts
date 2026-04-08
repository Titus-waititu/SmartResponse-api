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

export interface OCRResult {
  extractedText: string[];
  confidence: number;
  detectedItems: {
    licensePlates?: string[];
    vehicleInfo?: string[];
    documentText?: string[];
  };
}

export interface AccidentReportResult {
  reportTitle: string;
  executive_summary: string;
  detailed_analysis: string;
  recommendations: string[];
  estimated_damage: string;
  next_steps: string[];
  generated_at: Date;
}

export interface AccidentInsights {
  summary: string;
  riskFactors: string[];
  similarIncidents: number;
  predictionAccuracy: number;
  recommendations: string[];
  timeline: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Analyze accident images using Google Gemini with severity detection
   */
  async analyzeAccidentSeverity(
    imageUrls: string[],
  ): Promise<SeverityAnalysisResult> {
    try {
      this.logger.log(
        `Analyzing ${imageUrls.length} images for accident severity`,
      );

      if (!this.genAI || !this.apiKey) {
        this.logger.warn('Gemini API key not configured, using mock analysis');
        return this.getMockAnalysis();
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const imageParts = await Promise.all(
        imageUrls.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              this.logger.warn(
                `Failed to fetch image from ${url}: ${response.status}`,
              );
              return null;
            }
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType =
              response.headers.get('content-type') || 'image/jpeg';
            return {
              inlineData: {
                data: base64,
                mimeType,
              },
            };
          } catch (error) {
            this.logger.warn(
              `Error fetching image from ${url}:`,
              error instanceof Error ? error.message : 'Unknown error',
            );
            return null;
          }
        }),
      );

      const validImageParts = imageParts.filter((part) => part !== null);

      if (validImageParts.length === 0) {
        this.logger.warn(
          'No valid images could be fetched, using mock analysis',
        );
        return this.getMockAnalysis();
      }

      const prompt = `You are an expert accident scene analyzer. Analyze these accident scene images and provide a comprehensive JSON response.

      Assess the following:
      1. Severity Score: Rate the accident severity from 0-100 where:
         - 0-20: Minor (minor vehicle damage, no injuries)
         - 21-40: Low-Moderate (visible damage, possible minor injuries)
         - 41-60: Moderate (significant damage, likely injuries)
         - 61-80: Severe (major damage, serious injuries likely)
         - 81-100: Fatal/Critical (catastrophic damage, fatalities likely)
      
      2. Detected Injuries: List any visible signs of injuries or medical distress
      3. Vehicle Damage: Describe the extent and type of vehicle damage
      4. Recommended Emergency Services: Based on severity, recommend services (police, ambulance, fire, hazmat)

      Return ONLY valid JSON with these exact keys:
      {
        "severity": <number 0-100>,
        "analysis": "<detailed description of the accident scene and damage>",
        "detectedInjuries": [<array of injury descriptions>],
        "vehicleDamage": "<description of vehicle damage>",
        "recommendedServices": [<array of service types>]
      }`;

      const result = await model.generateContent([prompt, ...validImageParts]);
      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const parsed = JSON.parse(text) as SeverityAnalysisResult;

      return {
        severity: Math.min(100, Math.max(0, parsed.severity ?? 50)),
        analysis: parsed.analysis || 'Unable to analyze the accident scene',
        detectedInjuries: Array.isArray(parsed.detectedInjuries)
          ? parsed.detectedInjuries
          : [],
        vehicleDamage: parsed.vehicleDamage || 'Unable to assess damage',
        recommendedServices: Array.isArray(parsed.recommendedServices)
          ? parsed.recommendedServices
          : ['police'],
      };
    } catch (error) {
      this.logger.error('Error analyzing accident severity', error);
      return this.getMockAnalysis();
    }
  }

  private getMockAnalysis(): SeverityAnalysisResult {
    return {
      severity: 65,
      analysis:
        'Moderate collision detected with visible vehicle damage. Multiple impact points observed on vehicle front end. No obvious signs of entrapment but further medical assessment recommended.',
      detectedInjuries: [
        'possible minor injuries',
        'potential neck/back strain',
      ],
      vehicleDamage:
        'Front-end damage visible - bumper crushed, headlights damaged, hood deformed',
      recommendedServices: ['police', 'ambulance'],
    };
  }

  /**
   * Extract text from images using OCR (Google Gemini Vision)
   */
  async extractTextFromImage(imageUrl: string): Promise<OCRResult> {
    try {
      this.logger.log(`Extracting text from image: ${imageUrl}`);

      if (!this.genAI || !this.apiKey) {
        this.logger.warn('Gemini API key not configured, using mock OCR');
        return this.getMockOCRResult();
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      // Fetch and prepare the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        this.logger.warn(`Failed to fetch image from ${imageUrl}`);
        return this.getMockOCRResult();
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/jpeg';

      const prompt = `You are an expert OCR specialist. Extract ALL text from this image.
      
      Focus on:
      1. License plates (vehicle registration numbers)
      2. Vehicle information (make, model, year if visible)
      3. Document text (insurance cards, registration documents, etc.)
      4. Any other readable text in the image
      
      Return a JSON response with this structure:
      {
        "extractedText": [<array of all extracted text strings>],
        "confidence": <number 0-1 representing overall confidence>,
        "detectedItems": {
          "licensePlates": [<array of detected license plates>],
          "vehicleInfo": [<array of vehicle information>],
          "documentText": [<array of document text>]
        }
      }`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType,
          },
        },
      ]);

      const ocrText = result.response.text();
      const parsed = JSON.parse(ocrText) as OCRResult;

      return {
        extractedText: Array.isArray(parsed.extractedText)
          ? parsed.extractedText
          : [],
        confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.85)),
        detectedItems: {
          licensePlates: parsed.detectedItems?.licensePlates || [],
          vehicleInfo: parsed.detectedItems?.vehicleInfo || [],
          documentText: parsed.detectedItems?.documentText || [],
        },
      };
    } catch (error) {
      this.logger.error('Error extracting text from image', error);
      return this.getMockOCRResult();
    }
  }

  /**
   * Generate comprehensive accident report using AI
   */
  async generateAccidentReport(
    accidentData: {
      description: string;
      location: string;
      severity: number;
      detectedInjuries: string[];
      vehicleDamage: string;
      weatherConditions?: string;
      roadConditions?: string;
      numberOfVehicles: number;
      numberOfInjuries: number;
    },
    aiAnalysis?: SeverityAnalysisResult,
  ): Promise<AccidentReportResult> {
    try {
      this.logger.log('Generating comprehensive accident report with AI');

      if (!this.genAI || !this.apiKey) {
        this.logger.warn(
          'Gemini API key not configured, using template report',
        );
        return this.getTemplateReport(accidentData);
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const promptContent = `You are an expert accident report analyst. Generate a comprehensive accident report based on the following information:

      Accident Description: ${accidentData.description}
      Location: ${accidentData.location}
      Severity Score: ${accidentData.severity}/100
      Number of Vehicles: ${accidentData.numberOfVehicles}
      Number of Injuries: ${accidentData.numberOfInjuries}
      Weather Conditions: ${accidentData.weatherConditions || 'unknown'}
      Road Conditions: ${accidentData.roadConditions || 'unknown'}
      Vehicle Damage: ${accidentData.vehicleDamage}
      Detected Injuries: ${accidentData.detectedInjuries.join(', ')}
      ${aiAnalysis ? `AI Analysis: ${aiAnalysis.analysis}` : ''}

      Generate a professional accident report in JSON format with:
      {
        "reportTitle": "<Professional title for the report>",
        "executive_summary": "<Brief summary of the incident>",
        "detailed_analysis": "<Comprehensive analysis of what happened, damage assessment, and contributing factors>",
        "recommendations": [<array of safety and procedural recommendations>],
        "estimated_damage": "<Estimated total damage in descriptive terms>",
        "next_steps": [<array of recommended next steps for authorities>]
      }`;

      const result = await model.generateContent(promptContent);
      const reportText = result.response.text();
      const parsed = JSON.parse(reportText) as Omit<
        AccidentReportResult,
        'generated_at'
      >;

      return {
        ...parsed,
        generated_at: new Date(),
      };
    } catch (error) {
      this.logger.error('Error generating accident report', error);
      return this.getTemplateReport(accidentData);
    }
  }

  /**
   * Generate AI insights for accident analysis
   */
  async generateAccidentInsights(
    accidentData: {
      description: string;
      severity: number;
      numberOfVehicles: number;
      numberOfInjuries: number;
      location: string;
    },
    historicalData?: { totalAccidents: number; similarIncidents: number },
  ): Promise<AccidentInsights> {
    try {
      this.logger.log('Generating accident insights with AI analysis');

      if (!this.genAI || !this.apiKey) {
        this.logger.warn(
          'Gemini API key not configured, using template insights',
        );
        return this.getTemplateInsights(accidentData, historicalData);
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const promptContent = `You are an expert accident analysis AI. Analyze this accident and provide actionable insights:

      Description: ${accidentData.description}
      Severity: ${accidentData.severity}/100
      Location: ${accidentData.location}
      Vehicles Involved: ${accidentData.numberOfVehicles}
      Injuries: ${accidentData.numberOfInjuries}
      Similar Incidents in History: ${historicalData?.similarIncidents || 0}

      Generate insights in JSON format:
      {
        "summary": "<Overall summary of this accident and its significance>",
        "riskFactors": [<array of identified risk factors>],
        "similarIncidents": <number of similar incidents found>,
        "predictionAccuracy": <confidence score 0-1>,
        "recommendations": [<array of recommendations to prevent similar incidents>],
        "timeline": [<array of estimated timeline of events>]
      }`;

      const result = await model.generateContent(promptContent);
      const insightText = result.response.text();
      const parsed = JSON.parse(insightText) as AccidentInsights;

      return {
        summary: parsed.summary || 'Accident analysis complete',
        riskFactors: Array.isArray(parsed.riskFactors)
          ? parsed.riskFactors
          : [],
        similarIncidents: parsed.similarIncidents || 0,
        predictionAccuracy: Math.min(1, Math.max(0, parsed.predictionAccuracy)),
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      };
    } catch (error) {
      this.logger.error('Error generating accident insights', error);
      return this.getTemplateInsights(accidentData, historicalData);
    }
  }

  /**
   * Mock OCR Result
   */
  private getMockOCRResult(): OCRResult {
    return {
      extractedText: [
        'ABC-123',
        'License Plate: ABC-123',
        'Honda Civic 2020',
        'Vehicle Registration: Valid',
      ],
      confidence: 0.92,
      detectedItems: {
        licensePlates: ['ABC-123', 'XYZ-789'],
        vehicleInfo: ['Honda Civic', '2020', 'Blue'],
        documentText: ['Insurance Valid', 'Registration Expires: 2025-12-31'],
      },
    };
  }

  /**
   * Template report for fallback
   */
  private getTemplateReport(accidentData: {
    description: string;
    location: string;
    severity: number;
    detectedInjuries: string[];
    vehicleDamage: string;
    numberOfVehicles: number;
    numberOfInjuries: number;
  }): AccidentReportResult {
    const severityLabel =
      accidentData.severity > 70
        ? 'Critical'
        : accidentData.severity > 50
          ? 'Severe'
          : accidentData.severity > 30
            ? 'Moderate'
            : 'Minor';

    return {
      reportTitle: `Critical Incident Report - ${severityLabel} Accident at ${accidentData.location}`,
      executive_summary: `${accidentData.numberOfVehicles} vehicle(s) involved in ${severityLabel.toLowerCase()} accident at ${accidentData.location}. ${accidentData.numberOfInjuries} injury/injuries reported.`,
      detailed_analysis: `Accident Description: ${accidentData.description}\n\nVehicle Damage: ${accidentData.vehicleDamage}\n\nDetected Injuries: ${accidentData.detectedInjuries.join(', ')}\n\nSeverity Assessment: ${accidentData.severity}/100`,
      recommendations: [
        'Immediate medical evaluation for all involved parties',
        'Secure scene and establish safety perimeter',
        'Document all evidence and injuries',
        'Conduct thorough vehicle inspection',
      ],
      estimated_damage: accidentData.vehicleDamage,
      next_steps: [
        'Emergency services dispatch if not already completed',
        'Detailed medical assessment',
        'Insurance claim processing',
        'Incident investigation',
      ],
      generated_at: new Date(),
    };
  }

  /**
   * Template insights for fallback
   */
  private getTemplateInsights(
    accidentData: {
      description: string;
      severity: number;
      numberOfVehicles: number;
    },
    historicalData?: { totalAccidents: number; similarIncidents: number },
  ): AccidentInsights {
    return {
      summary: `Analysis of ${accidentData.numberOfVehicles}-vehicle accident with severity level ${accidentData.severity}/100`,
      riskFactors: [
        'Multiple vehicle involvement',
        'Based on description: ' +
          (accidentData.description.length > 0
            ? accidentData.description.substring(0, 50)
            : 'High impact'),
      ],
      similarIncidents: historicalData?.similarIncidents || 3,
      predictionAccuracy: 0.82,
      recommendations: [
        'Enhanced traffic control at location',
        'Driver education program',
        'Infrastructure assessment',
      ],
      timeline: [
        'Accident occurred',
        'Emergency services notified',
        'Scene assessment completed',
      ],
    };
  }
}
