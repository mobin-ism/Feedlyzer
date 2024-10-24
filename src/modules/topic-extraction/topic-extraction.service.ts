import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

@Injectable()
export class TopicExtractionService {
    private readonly logger = new Logger(TopicExtractionService.name)
    private readonly huggingFaceToken: string
    private readonly CANDIDATE_TOPICS = [
        'politics',
        'technology',
        'business',
        'sports',
        'entertainment',
        'health',
        'science',
        'education',
        'environment',
        'economy',
        'world news',
        'local news',
        'culture',
        'weather',
        'crime',
        'travel'
    ]

    constructor(private configService: ConfigService) {
        this.huggingFaceToken =
            this.configService.get<string>('HUGGING_FACE_TOKEN')
    }

    async extractTopics(text: string): Promise<string[]> {
        try {
            // Truncate text to avoid payload size issues (max 2048 tokens)
            const truncatedText = this.truncateText(text)

            // Create sequence pairs for zero-shot classification
            const sequences = this.CANDIDATE_TOPICS.map((topic) => ({
                text_1: truncatedText,
                text_2: topic
            }))

            const response = await axios.post(
                'https://api-inference.huggingface.co/models/cross-encoder/nli-deberta-v3-base',
                {
                    inputs: sequences
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.huggingFaceToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            // Process results and return top topics
            const results = response.data
            const topicScores = this.CANDIDATE_TOPICS.map((topic, index) => ({
                topic,
                score: Array.isArray(results) ? results[index] : 0
            }))

            return topicScores
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((item) => item.topic)
        } catch (error) {
            this.logger.error(`Error in topic extraction: ${error.message}`)

            // Fallback to basic keyword extraction
            return this.fallbackTopicExtraction(text)
        }
    }

    private truncateText(text: string): string {
        // Truncate to roughly 2000 characters to stay within token limits
        return text.length > 2000 ? text.substring(0, 2000) + '...' : text
    }

    private fallbackTopicExtraction(text: string): string[] {
        try {
            // Simple keyword-based fallback
            const words = text.toLowerCase().split(/\W+/)
            const wordFreq = new Map()

            // Count word frequencies
            words.forEach((word) => {
                if (word.length > 3) {
                    // Skip short words
                    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
                }
            })

            // Convert to array and sort by frequency
            const sortedWords = Array.from(wordFreq.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([word]) => word)
                .slice(0, 5)

            return sortedWords
        } catch (error) {
            this.logger.error(
                `Error in fallback topic extraction: ${error.message}`
            )
            return []
        }
    }
}
