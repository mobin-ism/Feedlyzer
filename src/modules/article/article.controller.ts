import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseBoolPipe,
    ParseIntPipe,
    Post,
    Query
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ArticleService } from './article.service'
import { CreateArticleDto } from './dto/create-article.dto'

@ApiTags('Article')
@Controller('article')
export class ArticleController {
    constructor(private readonly articleService: ArticleService) {}

    @Post()
    @ApiOperation({ summary: 'Fetch articles based on source configutration' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Source configuration created successfully',
        status: HttpStatus.CREATED
    })
    async fetch(@Body() createArticleDto: CreateArticleDto) {
        return {
            statusCode: HttpStatus.CREATED,
            message: 'Source configuration created successfully',
            result: await this.articleService.fetch(createArticleDto)
        }
    }

    @Get()
    @ApiOperation({
        summary: 'Paginated response of all articles'
    })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Data found successfully',
        status: HttpStatus.OK
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Limit the data',
        example: 25
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Search by name',
        example: 'Tech News Aggregator'
    })
    async paginate(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit') limit: number = parseInt(process.env.DEFAULT_PAGE_SIZE),
        @Query('search', new DefaultValuePipe('')) search = '',
        @Query('orderBy', new DefaultValuePipe('createdAt'))
        orderBy = 'createdAt',
        @Query('desc', new DefaultValuePipe(true), ParseBoolPipe)
        desc = true
    ) {
        limit = limit
            ? limit > parseInt(process.env.DEFAULT_PAGE_SIZE)
                ? parseInt(process.env.DEFAULT_PAGE_SIZE)
                : limit
            : parseInt(process.env.DEFAULT_PAGE_SIZE)

        const result = await this.articleService.paginate(
            {
                page,
                limit,
                route: process.env.APP_URL + '/api/article'
            },
            search,
            orderBy,
            desc
        )

        return {
            status: HttpStatus.OK,
            message: 'Data found',
            result: result.items,
            meta: result.meta,
            links: result.links
        }
    }

    @Get(':uuid')
    @ApiOperation({ summary: 'Fetch article by UUID' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Data found successfully',
        status: HttpStatus.OK
    })
    async findOne(@Param('uuid') uuid: string) {
        return {
            status: HttpStatus.OK,
            message: 'Data found',
            result: await this.articleService.findOne(uuid)
        }
    }

    @Delete(':uuid')
    @ApiOperation({ summary: 'Delete article by UUID' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Data deleted successfully',
        status: HttpStatus.OK
    })
    async remove(@Param('uuid') uuid: string) {
        return {
            status: HttpStatus.OK,
            message: 'Data deleted successfully',
            result: await this.articleService.remove(uuid)
        }
    }
}
