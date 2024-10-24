import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ExtractorModule } from '../extractor/extractor.module'
import { RssFeedParserModule } from '../rss-feed-parser/rss-feed-parser.module'
import { SourceConfigurationModule } from '../source-configuration/source-configuration.module'
import { ArticleController } from './article.controller'
import { ArticleService } from './article.service'
import { Article } from './entities/article.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([Article]),
        SourceConfigurationModule,
        RssFeedParserModule,
        ExtractorModule
    ],
    controllers: [ArticleController],
    providers: [ArticleService]
})
export class ArticleModule {}
