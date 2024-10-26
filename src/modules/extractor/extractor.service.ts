import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import OpenAI from 'openai'
@Injectable()
export class ExtractorService {
    private readonly logger = new Logger(ExtractorService.name)
    private model: any
    private readonly geminiToken: string
    private openai: OpenAI
    private readonly groqApiKey: string
    private readonly groqEndpoint: string =
        'https://api.groq.com/openai/v1/chat/completions'

    constructor(private configService: ConfigService) {
        this.geminiToken = this.configService.get<string>('GEMINI_API_KEY')
        const genAI = new GoogleGenerativeAI(this.geminiToken)
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY')
        })

        this.groqApiKey = this.configService.get<string>('GROQ_API_KEY')
    }

    /**
     * THIS METHOD EXTRACT ALL THE NECESSARY INFORMATION FROM THE ARTICLE LIKE TOPICS, KEYWORDS, NAMED ENTITIES, AND CATEGORY
     *
     * @param   {string}  articleContent  [articleContent description]
     * @param   {string}  articleTitle    [articleTitle description]
     *
     * @return  {[type]}                  [return description]
     */
    async extractInfoUsingGemini(articleTitle: string, articleContent: string) {
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
                topics: null,
                keywords: null,
                namedEntities: {
                    people: null,
                    organizations: null,
                    locations: null
                },
                category: 'Unknown'
            }
        }
    }

    /**
     * Extract necessary information like topics, keywords, named entities, and category from the article.
     *
     * @param   {string}  articleTitle    [articleTitle description]
     * @param   {string}  articleContent  [articleContent description]
     *
     * @return  {[type]}                  [return description]
     */
    async extractInfoUsingOpenAI(articleTitle: string, articleContent: string) {
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

            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an expert assistant for analyzing news articles.'
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 150
            })

            const resultText = response.choices[0]?.message?.content.trim()
            return JSON.parse(resultText || '{}')
        } catch (error) {
            this.logger.error(`Failed to extract topics: ${error.message}`)
            return {
                topics: null,
                keywords: null,
                namedEntities: {
                    people: null,
                    organizations: null,
                    locations: null
                },
                category: 'Unknown'
            }
        }
    }

    /**
     * THIS METHOD EXTRACTS ALL NECESSARY INFORMATION FROM THE ARTICLE LIKE TOPICS, KEYWORDS, NAMED ENTITIES, AND CATEGORY
     *
     * @param   {string}  articleContent  [articleContent description]
     * @param   {string}  articleTitle    [articleTitle description]
     *
     * @return  {[type]}                  [return description]
     */
    async extractInfoUsingGroqCloud(
        articleTitle: string,
        articleContent: string
    ) {
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

            const response = await axios.post(
                this.groqEndpoint,
                {
                    model: 'llama3-70b-8192', // Update model if necessary
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an intelligent assistant.'
                        },
                        { role: 'user', content: prompt }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.groqApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            // Parse and return the response
            const responseData = response.data.choices[0].message.content
            return this.cleanAndParseJSON(responseData)
        } catch (error) {
            this.logger.error(`Failed to extract information: ${error.message}`)
            return {
                topics: null,
                keywords: null,
                namedEntities: {
                    people: null,
                    organizations: null,
                    locations: null
                },
                category: 'Unknown'
            }
        }
    }

    /**
     * THIS METHOD CLEANS AND PARSES THE JSON RESPONSE FROM THE GROQ API
     *
     * @param   {string}  jsonString  [jsonString description]
     *
     * @return  {[type]}              [return description]
     */
    private cleanAndParseJSON(jsonString: string) {
        try {
            // Remove any prefix text before the actual JSON
            const jsonStart = jsonString.indexOf('{')
            const jsonEnd = jsonString.lastIndexOf('}')

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('Invalid JSON structure')
            }

            const cleanJson = jsonString.substring(jsonStart, jsonEnd + 1)
            return JSON.parse(cleanJson)
        } catch (error) {
            this.logger.error(`Failed to parse JSON: ${error.message}`)
            return {
                topics: null,
                keywords: null,
                namedEntities: {
                    people: null,
                    organizations: null,
                    locations: null
                },
                category: 'Unknown'
            }
        }
    }
}
