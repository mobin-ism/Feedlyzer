import { PartialType } from '@nestjs/swagger';
import { CreateTopicExtractionDto } from './create-topic-extraction.dto';

export class UpdateTopicExtractionDto extends PartialType(CreateTopicExtractionDto) {}
