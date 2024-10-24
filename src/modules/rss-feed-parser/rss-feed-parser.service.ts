import { Injectable, Logger } from '@nestjs/common'
import * as RssParser from 'rss-parser'

/**
 * PROPERTIES OF A FEED ITEM
 */
interface FeedItem {
    title: string
    description: string
    pubDate: string
    sourceUrl: string
}

@Injectable()
export class RssFeedParserService {
    private readonly parser: RssParser
    private readonly logger = new Logger(RssFeedParserService.name)

    constructor() {
        this.parser = new RssParser()
    }

    /**
     * PARSE A FEED
     *
     * @param   {string}  feedUrl  [feedUrl description]
     *
     * @return  {[type]}           [return description]
     */
    async parseFeed(feedUrl: string): Promise<FeedItem[]> {
        try {
            const feed = await this.parser.parseURL(feedUrl)

            if (!feed?.items?.length) {
                this.logger.warn(`No items found in feed: ${feedUrl}`)
                return []
            }

            return feed.items.map((item) => ({
                title: item.title || '',
                description: item.content || item.summary || '',
                pubDate: item.isoDate
                    ? new Date(item.isoDate).toISOString()
                    : new Date().toISOString(),
                sourceUrl: item.link || ''
            }))
        } catch (error) {
            this.logger.error(`Failed to parse feed: ${feedUrl}`)
            return []
        }
    }
}
