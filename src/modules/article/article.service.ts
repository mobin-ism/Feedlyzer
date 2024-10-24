import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    IPaginationOptions,
    paginate,
    Pagination
} from 'nestjs-typeorm-paginate'
import { FindOptionsOrder, ILike, Repository } from 'typeorm'
import { ExtractorService } from '../extractor/extractor.service'
import { RssFeedParserService } from '../rss-feed-parser/rss-feed-parser.service'
import { SourceConfigurationService } from '../source-configuration/source-configuration.service'
import { CreateArticleDto } from './dto/create-article.dto'
import { Article } from './entities/article.entity'

@Injectable()
export class ArticleService {
    constructor(
        @InjectRepository(Article)
        private readonly articleRepository: Repository<Article>,
        private readonly sourceConfigurationService: SourceConfigurationService,
        private readonly rssFeedParserService: RssFeedParserService,
        private readonly extrractorService: ExtractorService
    ) {}

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

                feedItems.map(async (item) => {
                    const article = new Article()
                    article.title = item.title
                    article.description = item.description
                    article.publicationDate = item.pubDate
                    article.sourceUrl = item.sourceUrl
                    const aboutToCreateArticle =
                        this.articleRepository.create(article)
                    const insights = await this.extrractorService.extractInfo(
                        aboutToCreateArticle.title,
                        aboutToCreateArticle.description
                    )
                    aboutToCreateArticle.insights = insights

                    const createdArticle =
                        await this.articleRepository.save(aboutToCreateArticle)

                    setTimeout(() => {
                        return createdArticle
                    }, 1000)
                })
            }

            return true
        } catch (error) {
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
}
