import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ArticleModule } from '../article/article.module'
import { ArticleInsight } from '../article/entities/article-insight.entity'
import { BatchExtractorService } from './batch-extractor.service'
import { ExtractorService } from './extractor.service'

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([ArticleInsight]),
        forwardRef(() => ArticleModule)
    ],
    providers: [ExtractorService, BatchExtractorService],
    exports: [ExtractorService, BatchExtractorService]
})
export class ExtractorModule {}
