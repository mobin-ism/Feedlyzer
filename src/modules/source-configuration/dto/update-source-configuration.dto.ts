import { PartialType } from '@nestjs/swagger';
import { CreateSourceConfigurationDto } from './create-source-configuration.dto';

export class UpdateSourceConfigurationDto extends PartialType(CreateSourceConfigurationDto) {}
