import { PartialType } from '@nestjs/swagger';
import { CreateEmergencyServiceDto } from './create-emergency-service.dto';

export class UpdateEmergencyServiceDto extends PartialType(CreateEmergencyServiceDto) {}
