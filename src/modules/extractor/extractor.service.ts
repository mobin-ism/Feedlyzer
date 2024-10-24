import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ExtractorService {
    private readonly logger = new Logger(ExtractorService.name)
    private model: any
    private readonly geminiToken: string

    constructor(private configService: ConfigService) {
        this.geminiToken = this.configService.get<string>('GEMINI_API_KEY')
        const genAI = new GoogleGenerativeAI(this.geminiToken)
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
    }

    /**
     * THIS METHOD EXTRACT ALL THE NECESSARY INFORMATION FROM THE ARTICLE LIKE TOPICS, KEYWORDS, NAMED ENTITIES, AND CATEGORY
     *
     * @param   {string}  articleContent  [articleContent description]
     * @param   {string}  articleTitle    [articleTitle description]
     *
     * @return  {[type]}                  [return description]
     */
    async extractInfo(articleTitle: string, articleContent: string) {
        try {
            const prompt = `
        Analyze this news article and extract the following information in JSON format:
        1. Main topics (up to 3) (comma-separated string)
        2. Keywords (up to 5) (comma-separated string)
        3. Named entities (people, organizations, locations) (comma-separated string)
        4. Category (one of: Politics, Technology, Business, Sports, Entertainment, Science, Health)

        Title: ${articleTitle}
        Content: ${articleContent.substring(0, 4000)}

        Respond only with a JSON object containing these fields:
        {
          "topics": "",
          "keywords": "",
          "namedEntities": {"people": "", "organizations": "", "locations": ""},
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
                namedEntities: {
                    people: [],
                    organizations: [],
                    locations: []
                },
                category: 'Unknown'
            }
        }
    }
}
