import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TopicExtractionController } from './topic-extraction.controller'
import { TopicExtractionService } from './topic-extraction.service'

@Module({
    imports: [ConfigModule],
    controllers: [TopicExtractionController],
    providers: [TopicExtractionService]
})
export class TopicExtractionModule {}
