import {
    forwardRef,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    OnModuleInit
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import MeiliSearch from 'meilisearch'
import {
    IPaginationOptions,
    paginate,
    Pagination
} from 'nestjs-typeorm-paginate'
import { FindOptionsOrder, ILike, Repository } from 'typeorm'
import { BatchExtractorService } from '../extractor/batch-extractor.service'
import { RssFeedParserService } from '../rss-feed-parser/rss-feed-parser.service'
import { SourceConfigurationService } from '../source-configuration/source-configuration.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { ArticleInsight } from './entities/article-insight.entity'
import { Article } from './entities/article.entity'

interface ArticleDocument {
    id: number
    title: string
    description: string
    publicationDate: string
    sourceUrl: string
    topics: string
    keywords: string
    people: string
    organizations: string
    locations: string
    category: string
}

@Injectable()
export class ArticleService implements OnModuleInit {
    constructor(
        @InjectRepository(Article)
        private readonly articleRepository: Repository<Article>,
        @InjectRepository(ArticleInsight)
        private readonly articleInsightRepository: Repository<ArticleInsight>,
        private readonly sourceConfigurationService: SourceConfigurationService,
        private readonly rssFeedParserService: RssFeedParserService,
        @Inject(forwardRef(() => BatchExtractorService))
        private readonly batchExtractorService: BatchExtractorService,
        private configService: ConfigService,
        private eventEmitter: EventEmitter2
    ) {}

    onModuleInit() {
        this.initializeIndex()
    }
    /**
     * INITIALIZING MEILISEARCH CLIENT
     */
    private _client = new MeiliSearch({
        host: this.configService.get<string>('MEILISEARCH_URL'),
        apiKey: this.configService.get<string>('MEILI_MASTER_KEY')
    })

    /**
     * FETCHING ALL THE ARTICLES FROM A SOURCE CONFIGURATION
     *
     * @param   {CreateArticleDto}  createArticleDto  [createArticleDto description]
     *
     * @return  {[type]}                              [return description]
     */
    async fetch(createArticleDto: CreateArticleDto) {
        const sourceConfiguration =
            await this.sourceConfigurationService.findOne(
                createArticleDto.sourceConfigurationUuid
            )
        if (!sourceConfiguration) {
            throw new HttpException(
                'Source configuration not found',
                HttpStatus.NOT_FOUND
            )
        }

        try {
            for (const source of sourceConfiguration.sources) {
                const feedItems =
                    await this.rssFeedParserService.parseFeed(source)

                for (const feedItem of feedItems) {
                    const article = new Article()
                    article.title = feedItem.title
                    article.description = feedItem.description
                    article.publicationDate = feedItem.pubDate
                    article.sourceUrl = feedItem.sourceUrl
                    const aboutToCreateArticle =
                        this.articleRepository.create(article)
                    await this.articleRepository.save(aboutToCreateArticle)
                }
            }

            const articles = await this.articleRepository.find()
            await this.batchExtractorService.processArticles(articles)

            return true
        } catch (error) {
            console.log(error)
            throw new HttpException(
                'Failed to fetch articles',
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    /**
     * PAGINATED RESPONSE FOR ARTICLES
     * @param options
     * @param search
     * @param orderBy
     * @param desc
     * @returns
     */
    async paginate(
        options: IPaginationOptions,
        search: string,
        orderBy: string,
        desc: boolean
    ): Promise<Pagination<Article>> {
        const orderByQueries = ['name', 'createdAt']
        if (orderByQueries.indexOf(orderBy) === -1) {
            orderBy = 'createdAt'
        }

        const orderByCondition: FindOptionsOrder<Article> = {
            [orderBy]: desc ? 'DESC' : 'ASC'
        }

        return paginate<Article>(this.articleRepository, options, {
            where: {
                title: ILike(`%${search.toLowerCase()}%`)
            },
            order: orderByCondition
        })
    }

    /**
     * FINDING A SINGLE ARTICLE
     *
     * @param   {string}  uuid  [uuid description]
     *
     * @return  {[type]}        [return description]
     */
    async findOne(uuid: string) {
        return await this.articleRepository.findOne({
            where: { uuid }
        })
    }

    /**
     * REMOVING AN ARTICLE
     *
     * @param   {string}  uuid  [uuid description]
     *
     * @return  {[type]}        [return description]
     */
    async remove(uuid: string) {
        const previousData = await this.findOne(uuid)
        if (!previousData) {
            throw new HttpException('Data not found', HttpStatus.NOT_FOUND)
        }
        return await this.articleRepository.remove(previousData)
    }

    /**
     * GENERATING ARTICLE INDEX
     * @returns
     */
    private getArticleIndex() {
        const index = this._client.index('article')
        index.updateSortableAttributes(['publicationDate', 'title', 'category'])
        index.updateFilterableAttributes([
            'title',
            'topics',
            'category',
            'keywords',
            'people',
            'organizations',
            'locations',
            'publicationDate'
        ])
        return index
    }

    async initializeIndex() {
        const index = this.getArticleIndex()
        await index.updateSettings({
            searchableAttributes: [
                'title',
                'description',
                'topics',
                'keywords',
                'people',
                'organizations',
                'locations',
                'category'
            ],
            filterableAttributes: [
                'title',
                'topics',
                'category',
                'keywords',
                'people',
                'organizations',
                'locations',
                'publicationDate'
            ],
            sortableAttributes: ['publicationDate', 'title', 'category']
        })
    }

    // ADD ARTICLE IN MEILISEARCH
    async addArticleDocuments(articleInsights: ArticleInsight) {
        const document = await this.prepareArticleDocument(articleInsights)
        const index = this.getArticleIndex()
        return index.addDocuments(document)
    }

    // REMOVE ARTICLE FROM MEILISEARCH
    private deleteArticleDocuments(article: Article) {
        const index = this.getArticleIndex()
        return index.deleteDocument(article.id)
    }

    // INSERT ALL THE ARTICLES IN MEILISEARCH
    async insertAllTheArticlesToMeilisearch() {
        this.removeAllTheArticleFromMeilisearch()
        const articleInsights = await this.articleInsightRepository.find()
        for (const articleInsight of articleInsights) {
            await this.addArticleDocuments(articleInsight)
        }
    }

    // REMOVE ALL THE ARTICLES FROM MEILISEARCH
    async removeAllTheArticleFromMeilisearch() {
        const index = this.getArticleIndex()
        try {
            return await index.deleteAllDocuments()
        } catch (error) {
            console.error('Error removing documents from MeiliSearch:', error)
        }
    }

    // SEARCH ARTICLE BASED ON MEILISEARCH KEYWORD
    async findByKeyword(
        keyword?: string,
        title?: string,
        category?: string,
        people?: string,
        organizations?: string,
        locations?: string,
        topics?: string,
        publicationDate?: string
    ) {
        const searchOptions: any = {
            attributesToRetrieve: [
                'title',
                'description',
                'publicationDate',
                'sourceUrl',
                'topics',
                'keywords',
                'people',
                'organizations',
                'locations',
                'category'
            ],
            sort: ['title:asc'],
            limit: 10000
        }

        // Construct filters based on the optional parameters
        // const filters: string[] = []
        // if (title) {
        //     filters.push(`title = "${title}"`)
        // }
        // if (category) {
        //     filters.push(`category = "${category}"`)
        // }
        // if (people) {
        //     filters.push(`people = "${people}"`)
        // }
        // if (organizations) {
        //     filters.push(`organizations = "${organizations}"`)
        // }
        // if (locations) {
        //     filters.push(`locations = "${locations}"`)
        // }
        // if (topics) {
        //     filters.push(`topics = "${topics}"`)
        // }
        // if (publicationDate) {
        //     filters.push(`publicationDate = "${publicationDate}"`)
        // }

        // // Add filters to search options if there are any
        // if (filters.length > 0) {
        //     searchOptions.filter = filters.join(' AND ')
        // }

        // // Add filters to search options if there are any
        // if (filters.length > 0) {
        //     searchOptions.filter = filters.join(' AND ')
        // }

        const searchResponse = await this.getArticleIndex().search(
            keyword || '',
            searchOptions
        )

        return searchResponse.hits
    }

    // PREPARE ARTICLE DOCUMENT
    private async prepareArticleDocument(articleInsight: ArticleInsight) {
        const article = await this.articleRepository.findOne({
            where: { id: articleInsight.articleId }
        })

        return [
            {
                id: article.id,
                title: article.title,
                description: article.description,
                publicationDate: article.publicationDate,
                sourceUrl: article.sourceUrl,
                topics: articleInsight.topics,
                keywords: articleInsight.keywords,
                people: articleInsight.people,
                organizations: articleInsight.organizations,
                locations: articleInsight.locations,
                category: articleInsight.category
            }
        ]
    }

    /**
     * CHANGE THE STATUS OF AN ARTICLE
     */
    async updateStatusToProcessed(id: number, isProcessed: boolean) {
        const article = await this.articleRepository.findOne({
            where: { id }
        })
        if (!article) {
            throw new HttpException('Article not found', HttpStatus.NOT_FOUND)
        }
        article.isProcessed = isProcessed ? true : false
        return await this.articleRepository.save(article)
    }

    /**
     * ADD A CRON JOB FOR FETCHING ARTICLES ON EVERY DAY AT 10:00 AM
     */
    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async parseRssFeedOnRegularBasis() {
        const sourceConfigurations =
            await this.sourceConfigurationService.findAll()
        if (sourceConfigurations.length === 0) {
            console.log('No source configurations found')
            return
        }
        for (const sourceConfiguration of sourceConfigurations) {
            await this.fetch({
                sourceConfigurationUuid: sourceConfiguration.uuid
            })
        }

        await this.processUnprocessedArticles()
    }

    /**
     * PROCESS UNPROCESSED ARTICLES
     */
    async processUnprocessedArticles() {
        const articles = await this.articleRepository.find({
            where: { isProcessed: false }
        })
        if (articles.length === 0) {
            console.log('No unprocessed articles found')
            return
        }
        await this.batchExtractorService.processArticles(articles)
    }
}
