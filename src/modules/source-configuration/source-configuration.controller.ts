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
    Patch,
    Post,
    Query
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateSourceConfigurationDto } from './dto/create-source-configuration.dto'
import { UpdateSourceConfigurationDto } from './dto/update-source-configuration.dto'
import { SourceConfigurationService } from './source-configuration.service'

@ApiTags('Source Configuration')
@Controller('source-configuration')
export class SourceConfigurationController {
    constructor(
        private readonly sourceConfigurationService: SourceConfigurationService
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new source configuration' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Source configuration created successfully',
        status: HttpStatus.CREATED
    })
    async create(
        @Body() createSourceConfigurationDto: CreateSourceConfigurationDto
    ) {
        return {
            statusCode: HttpStatus.CREATED,
            message: 'Source configuration created successfully',
            result: await this.sourceConfigurationService.create(
                createSourceConfigurationDto
            )
        }
    }

    @Get()
    @ApiOperation({
        summary: 'Paginated response of all source configurations'
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

        const result = await this.sourceConfigurationService.paginate(
            {
                page,
                limit,
                route: process.env.APP_URL + '/api/source-configuration'
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

    @Get('all')
    @ApiOperation({ summary: 'Get all source configurations' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Source configurations retrieved successfully',
        status: HttpStatus.OK
    })
    async findAll() {
        return {
            statusCode: HttpStatus.OK,
            message: 'Source configurations retrieved successfully',
            result: await this.sourceConfigurationService.findAll()
        }
    }

    @Get(':uuid')
    @ApiOperation({ summary: 'Get a source configuration by id' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Source configuration retrieved successfully',
        status: HttpStatus.OK
    })
    async findOne(@Param('uuid') uuid: string) {
        return {
            statusCode: HttpStatus.OK,
            message: 'Source configuration retrieved successfully',
            result: await this.sourceConfigurationService.findOne(uuid)
        }
    }

    @Patch(':uuid')
    @ApiOperation({ summary: 'Update a source configuration' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Source configuration updated successfully',
        status: HttpStatus.OK
    })
    async update(
        @Param('uuid') uuid: string,
        @Body() updateSourceConfigurationDto: UpdateSourceConfigurationDto
    ) {
        return {
            statusCode: HttpStatus.OK,
            message: 'Source configuration updated successfully',
            result: await this.sourceConfigurationService.update(
                uuid,
                updateSourceConfigurationDto
            )
        }
    }

    @Delete(':uuid')
    @ApiOperation({ summary: 'Delete a source configuration' })
    @ApiResponse({ description: 'Bad Request', status: HttpStatus.BAD_REQUEST })
    @ApiResponse({
        description: 'Something went wrong',
        status: HttpStatus.INTERNAL_SERVER_ERROR
    })
    @ApiResponse({
        description: 'Source configuration deleted successfully',
        status: HttpStatus.OK
    })
    async remove(@Param('uuid') uuid: string) {
        return {
            statusCode: HttpStatus.OK,
            message: 'Source configuration deleted successfully',
            result: await this.sourceConfigurationService.remove(uuid)
        }
    }
}
