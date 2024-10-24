import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeOrmAsyncConfig } from 'src/config/typeorm.config'
import { SourceConfigurationModule } from './modules/source-configuration/source-configuration.module'
import { TopicExtractionModule } from './modules/topic-extraction/topic-extraction.module'
import { ArticleModule } from './modules/article/article.module';
import { RssFeedParserModule } from './modules/rss-feed-parser/rss-feed-parser.module';
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env'],
            isGlobal: true,
            cache: true
        }),
        ThrottlerModule.forRootAsync({
            useFactory: async () => ({
                throttlers: [
                    {
                        ttl:
                            parseInt(
                                process.env.RATE_LIMITER_TIME_TO_LEAVE,
                                10
                            ) || 60000, // default to 60000 if env variable not present
                        limit:
                            parseInt(process.env.RATE_LIMITER_MAX_TRY, 10) || 2 // default to 2 if env variable not present
                    }
                ]
            })
        }),
        TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
        ScheduleModule.forRoot(),
        SourceConfigurationModule,
        TopicExtractionModule,
        ArticleModule,
        RssFeedParserModule
    ],
    exports: [TypeOrmModule]
})
export class AppModule {}
