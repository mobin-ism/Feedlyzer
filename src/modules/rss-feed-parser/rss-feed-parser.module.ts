import { Module } from '@nestjs/common'
import { RssFeedParserService } from './rss-feed-parser.service'

@Module({
    providers: [RssFeedParserService],
    exports: [RssFeedParserService]
})
export class RssFeedParserModule {}
