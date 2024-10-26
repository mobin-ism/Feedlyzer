import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { sleep } from 'src/common/helpers/utils.helper'
import { Repository } from 'typeorm'
import { ArticleService } from '../article/article.service'
import { ArticleInsight } from '../article/entities/article-insight.entity'
import { Article } from '../article/entities/article.entity'
import { ExtractorService } from './extractor.service'

@Injectable()
export class BatchExtractorService {
    private readonly logger = new Logger(BatchExtractorService.name)
    private readonly RATE_LIMIT = 30 // Requests per minute
    private readonly BATCH_SIZE = 5 // Number of concurrent requests
    private readonly DELAY_BETWEEN_REQUESTS =
        (60000 / this.RATE_LIMIT) * this.BATCH_SIZE

    constructor(
        private readonly extractorService: ExtractorService,
        @InjectRepository(ArticleInsight)
        private readonly articleInsightRepository: Repository<ArticleInsight>,
        @Inject(forwardRef(() => ArticleService))
        private readonly articleService: ArticleService
    ) {}

    /**
     * Process multiple articles with rate limiting and error handling
     */
    async processArticles(articles: Article[]): Promise<ArticleInsight[]> {
        const results: ArticleInsight[] = []
        let processedCount = 0

        try {
            for (let i = 0; i < articles.length; i += this.BATCH_SIZE) {
                await sleep(this.DELAY_BETWEEN_REQUESTS)
                const batch = articles.slice(i, i + this.BATCH_SIZE)
                const batchPromises = batch.map(async (article) => {
                    try {
                        await sleep(this.DELAY_BETWEEN_REQUESTS)

                        const insight =
                            await this.extractorService.extractInfoUsingGroqCloud(
                                article.title,
                                article.description
                            )

                        insight['people'] = insight['namedEntities']['people']
                        insight['organizations'] =
                            insight['namedEntities']['organizations']
                        insight['locations'] =
                            insight['namedEntities']['locations']
                        const articleInsight: ArticleInsight = {
                            articleId: article.id,
                            ...insight,
                            status: 'success'
                        }

                        await this.saveArticleInsights(articleInsight)

                        processedCount++
                        this.logger.log(
                            `Processed ${processedCount}/${articles.length} articles`
                        )

                        return articleInsight
                    } catch (error) {
                        const failedArticleInsights = new ArticleInsight()
                        failedArticleInsights.articleId = article.id
                        failedArticleInsights.status = 'failed'
                        await this.saveArticleInsights(failedArticleInsights)
                        return failedArticleInsights
                    }
                })

                const batchResults = await Promise.all(batchPromises)
                results.push(...batchResults)

                if (i + this.BATCH_SIZE < articles.length) {
                    await sleep(1000)
                }
            }

            const successCount = results.filter(
                (r) => r.status === 'success'
            ).length
            const failureCount = results.filter(
                (r) => r.status === 'failed'
            ).length

            this.logger.log(
                `Processing completed. Success: ${successCount}, Failed: ${failureCount}`
            )

            return results
        } catch (error) {
            this.logger.error('Batch processing failed:', error)
            throw error
        }
    }

    /**
     * Save articleInsights to database with retry mechanism
     */
    private async saveArticleInsights(
        articleInsights: ArticleInsight,
        retries = 3
    ): Promise<void> {
        for (let i = 0; i < retries; i++) {
            try {
                const createdArticleInsights =
                    await this.articleInsightRepository.save(articleInsights)
                // UPDATE THE STATUS OF THE ARTICLE TO PROCESSED
                await this.articleService.updateStatusToProcessed(
                    createdArticleInsights.articleId,
                    true
                )
                //LETS PUSH THE DATA TO THE ARTICLE DOCUMENTS OF MEILISEARCH
                this.articleService.addArticleDocuments(createdArticleInsights)
                return
            } catch (error) {
                if (i === retries - 1) {
                    this.logger.error(
                        `Failed to save articleInsights for article ${articleInsights.articleId} after ${retries} attempts`,
                        error
                    )
                    throw error
                }
                await sleep(1000 * (i + 1))
            }
        }
    }

    /**
     * Retry failed articles
     */
    async retryFailedArticles(articles: Article[]): Promise<ArticleInsight[]> {
        const failedInsights = await this.articleInsightRepository.find({
            where: { status: 'failed' }
        })

        if (failedInsights.length === 0) {
            this.logger.log('No failed articles to retry')
            return []
        }

        // Filter articles that need retry
        const articlesToRetry = articles.filter((article) =>
            failedInsights.some((insight) => insight.articleId === article.id)
        )

        if (articlesToRetry.length === 0) {
            this.logger.log('No matching articles found for retry')
            return []
        }

        return this.processArticles(articlesToRetry)
    }
}
