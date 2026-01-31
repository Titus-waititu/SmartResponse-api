# Smart Accident Report System - AI Integration Guide

## Overview

This smart accident reporting system now includes advanced AI capabilities for analyzing accident severity from images and automatically dispatching emergency services based on the analysis.

## New Features

### 1. AI Image Analysis

- **Service**: `AiService`
- **Capability**: Analyzes accident scene images using OpenAI Vision API
- **Output**:
  - Severity score (0-100)
  - Detailed analysis text
  - Detected injuries
  - Vehicle damage assessment
  - Recommended emergency services

### 2. Automated Emergency Dispatch

- **Service**: `DispatchService`
- **Capability**: Automatically dispatches emergency services based on AI-determined severity
- **Dispatch Rules**:
  - **Critical (70-100)**: Police + Ambulance + Fire Department
  - **High (50-69)**: Police + Ambulance
  - **Medium (30-49)**: Police only
  - **Low (0-29)**: Notification only (no automatic dispatch)

### 3. File Upload Management

- **Service**: `UploadService`
- **Capability**: Validates and stores accident scene images
- **Validation**:
  - Accepted formats: JPEG, PNG
  - Maximum file size: 10MB
  - Generates unique filenames
  - Returns secure URLs

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install openai multer @nestjs/platform-express @types/multer
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# OpenAI configuration
OPENAI_API_KEY=your_openai_api_key_here

# File upload configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### 3. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

### 4. Create Upload Directory

```bash
mkdir uploads
```

## API Endpoints

### Create Accident Report with AI Analysis

**Endpoint**: `POST /api/v1/accidents/report`

**Authentication**: Public (no token required)

**Content-Type**: `multipart/form-data`

**Request Body**:

```json
{
  "description": "Two-car collision at intersection",
  "location": "Main St & 5th Ave",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "userId": "optional-user-id",
  "images": [File, File, ...] // Max 10 images
}
```

**Response**:

```json
{
  "accident": {
    "id": "acc-123456",
    "reportNumber": "ACC-2024-001234",
    "description": "Two-car collision at intersection",
    "location": "Main St & 5th Ave",
    "severity": 75,
    "aiAnalysis": {
      "severity": 75,
      "analysis": "Severe collision detected...",
      "detectedInjuries": ["head trauma", "lacerations"],
      "vehicleDamage": "major front-end damage",
      "recommendedServices": ["ambulance", "police", "fire"]
    },
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "dispatchResult": {
    "services": [
      {
        "id": "svc-001",
        "type": "police",
        "status": "dispatched",
        "serviceProvider": "Local Police Department",
        "dispatchedAt": "2024-01-15T10:30:05Z"
      },
      {
        "id": "svc-002",
        "type": "ambulance",
        "status": "dispatched",
        "serviceProvider": "Emergency Medical Services",
        "dispatchedAt": "2024-01-15T10:30:05Z"
      },
      {
        "id": "svc-003",
        "type": "fire_department",
        "status": "dispatched",
        "serviceProvider": "City Fire Department",
        "dispatchedAt": "2024-01-15T10:30:05Z"
      }
    ],
    "notification": {
      "id": "notif-001",
      "title": "Emergency Services Dispatched",
      "message": "Emergency services have been dispatched...",
      "priority": "urgent"
    }
  }
}
```

### Test with cURL

```bash
curl -X POST http://localhost:8080/api/v1/accidents/report \
  -H "Content-Type: multipart/form-data" \
  -F "description=Severe collision with injuries" \
  -F "location=Main St & 5th Ave" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "images=@accident_photo1.jpg" \
  -F "images=@accident_photo2.jpg"
```

### Test with Swagger UI

1. Start the server: `pnpm start:dev`
2. Navigate to: `http://localhost:8080/api/docs`
3. Find the `POST /api/v1/accidents/report` endpoint
4. Click "Try it out"
5. Fill in the form fields
6. Upload images
7. Execute the request

## Architecture

### Flow Diagram

```
User Reports Accident with Images
            ↓
    Upload Service validates images
            ↓
    AI Service analyzes severity
            ↓
    Accidents Service creates record
            ↓
    Dispatch Service routes to emergency services
            ↓
    Notification sent to user
```

### Module Structure

```
src/
├── accidents/
│   ├── accidents.service.ts      # Enhanced with createWithAnalysis()
│   ├── accidents.controller.ts   # New /report endpoint
│   └── accidents.module.ts       # Imports AI, Upload, Dispatch modules
├── ai/
│   ├── ai.service.ts             # OpenAI Vision integration
│   └── ai.module.ts              # AI module configuration
├── upload/
│   ├── upload.service.ts         # File validation & storage
│   └── upload.module.ts          # Upload module configuration
├── dispatch/
│   ├── dispatch.service.ts       # Emergency service routing
│   └── dispatch.module.ts        # Dispatch module configuration
└── app.module.ts                 # Root module with all imports
```

## AI Analysis Details

### Severity Scoring

The AI analyzes images and assigns a severity score based on:

- **Vehicle damage severity** (0-30 points)
- **Visible injuries** (0-40 points)
- **Environmental hazards** (0-20 points)
- **Number of vehicles involved** (0-10 points)

### Emergency Service Routing Logic

```typescript
if (severity > 70) {
  // Critical: All services
  dispatch(['police', 'ambulance', 'fire']);
} else if (severity > 50) {
  // High: Police + Medical
  dispatch(['police', 'ambulance']);
} else if (severity > 30) {
  // Medium: Police only
  dispatch(['police']);
} else {
  // Low: Notification only
  sendNotification();
}
```

## Future Enhancements

### Planned Features

1. **Real-time Geolocation**
   - Calculate distance to nearest emergency services
   - Provide ETA to accident scene
   - Optimize dispatch routing

2. **WebSocket Notifications**
   - Real-time status updates
   - Live emergency service tracking
   - Two-way communication with responders

3. **Analytics Dashboard**
   - Accident hotspot mapping
   - Response time analytics
   - Severity trend analysis
   - Service utilization metrics

4. **Machine Learning Improvements**
   - Custom-trained model for accident severity
   - Pattern recognition for accident types
   - Predictive response time estimation

5. **Multi-language Support**
   - AI analysis in multiple languages
   - Localized emergency service integration

## Troubleshooting

### Common Issues

**Issue**: "OpenAI API key not configured"

- **Solution**: Add `OPENAI_API_KEY` to your `.env` file

**Issue**: "Upload directory not found"

- **Solution**: Run `mkdir uploads` in the project root

**Issue**: "File too large" error

- **Solution**: Images must be under 10MB. Resize or compress images.

**Issue**: "Invalid file type"

- **Solution**: Only JPEG and PNG formats are accepted

### Debug Mode

Enable detailed logging:

```env
TYPEORM_LOGGING=true
LOG_LEVEL=debug
```

## Security Considerations

1. **API Key Protection**
   - Never commit `.env` file to version control
   - Use environment-specific API keys
   - Rotate keys regularly

2. **File Upload Security**
   - Files are validated before processing
   - Unique filenames prevent collisions
   - File size limits prevent abuse

3. **Rate Limiting**
   - Consider implementing rate limits for the `/report` endpoint
   - Protect against API abuse

## Cost Considerations

### OpenAI API Usage

- **Vision API**: ~$0.01 per image analysis
- **Monthly estimate**: Depends on usage volume
- **Optimization**: Cache analysis results for similar images

### Storage Costs

- **Local Storage**: Minimal cost
- **Cloud Storage**: Consider AWS S3 or Azure Blob for production
- **Image Compression**: Implement to reduce storage costs

## Production Checklist

- [ ] Configure production OpenAI API key
- [ ] Set up cloud storage for uploads (S3/Azure Blob)
- [ ] Configure CDN for image delivery
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Implement proper logging
- [ ] Set up CI/CD pipeline
- [ ] Configure SSL/TLS
- [ ] Set up database migrations
- [ ] Implement caching strategy
- [ ] Configure production environment variables

## Support

For issues or questions:

- Check the [main README](./README.md)
- Review the [setup guide](./SETUP_GUIDE.md)
- Check API documentation at `/api/docs`

## License

[Your License Here]
