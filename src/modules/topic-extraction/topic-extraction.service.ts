import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as RssParser from 'rss-parser'

interface FeedItem {
    title: string
    description: string
    pubDate: Date
    sourceUrl: string
}

@Injectable()
export class TopicExtractionService {
    private readonly parser: RssParser
    private readonly logger = new Logger(TopicExtractionService.name)
    private model: any
    private readonly geminiToken: string

    constructor(private configService: ConfigService) {
        this.geminiToken = this.configService.get<string>('GEMINI_API_KEY')
        const genAI = new GoogleGenerativeAI(this.geminiToken)
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
        this.parser = new RssParser()
    }

    async extractTopics(articleContent: string, articleTitle: string) {
        try {
            const prompt = `
        Analyze this news article and extract the following information in JSON format:
        1. Main topics (up to 3)
        2. Keywords (up to 5)
        3. Named entities (people, organizations, locations)
        4. Category (one of: Politics, Technology, Business, Sports, Entertainment, Science, Health)

        Title: ${articleTitle}
        Content: ${articleContent.substring(0, 4000)}

        Respond only with a JSON object containing these fields:
        {
          "topics": [],
          "keywords": [],
          "named_entities": {"people": [], "organizations": [], "locations": []},
          "category": ""
        }
      `

            const result = await this.model.generateContent(prompt)
            const response = result.response
            return JSON.parse(response.text())
        } catch (error) {
            this.logger.error(`Failed to extract topics: ${error.message}`)
            return {
                topics: [],
                keywords: [],
                named_entities: {
                    people: [],
                    organizations: [],
                    locations: []
                },
                category: 'Unknown'
            }
        }
    }

    async parseFeed(feedUrl: string) {
        try {
            const feed = await this.parser.parseURL(feedUrl)

            feed.items.map((item) => ({
                title: item.title || '',
                description: item.description || item.summary || '',
                pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                sourceUrl: item.link || ''
            }))
            console.log(feed)
            return feed.items
        } catch (error) {
            this.logger.error(`Failed to parse feed: ${error.message}`)
            throw error
        }
    }
}
