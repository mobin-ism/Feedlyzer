import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    IPaginationOptions,
    paginate,
    Pagination
} from 'nestjs-typeorm-paginate'
import { FindOptionsOrder, ILike, Repository } from 'typeorm'
import { CreateSourceConfigurationDto } from './dto/create-source-configuration.dto'
import { UpdateSourceConfigurationDto } from './dto/update-source-configuration.dto'
import { SourceConfiguration } from './entities/source-configuration.entity'

@Injectable()
export class SourceConfigurationService {
    constructor(
        @InjectRepository(SourceConfiguration)
        private readonly sourceConfigurationRepository: Repository<SourceConfiguration>
    ) {}

    async create(createSourceConfigurationDto: CreateSourceConfigurationDto) {
        const sourceConfiguration = new SourceConfiguration()
        sourceConfiguration.name = createSourceConfigurationDto.name
        sourceConfiguration.sources = createSourceConfigurationDto.sources
        return await this.sourceConfigurationRepository.save(
            sourceConfiguration
        )
    }

    /**
     * PAGINATED RESPONSE FOR SOURCE CONFIGURATIONS
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
    ): Promise<Pagination<SourceConfiguration>> {
        const orderByQueries = ['name', 'createdAt']
        if (orderByQueries.indexOf(orderBy) === -1) {
            orderBy = 'createdAt'
        }

        const orderByCondition: FindOptionsOrder<SourceConfiguration> = {
            [orderBy]: desc ? 'DESC' : 'ASC'
        }

        return paginate<SourceConfiguration>(
            this.sourceConfigurationRepository,
            options,
            {
                where: {
                    name: ILike(`%${search.toLowerCase()}%`)
                },
                order: orderByCondition
            }
        )
    }

    async findAll() {
        return await this.sourceConfigurationRepository.find()
    }

    async findOne(uuid: string) {
        return await this.sourceConfigurationRepository.findOne({
            where: { uuid }
        })
    }

    async update(
        uuid: string,
        updateSourceConfigurationDto: UpdateSourceConfigurationDto
    ) {
        const sourceConfiguration =
            await this.sourceConfigurationRepository.findOne({
                where: { uuid }
            })
        sourceConfiguration.name = updateSourceConfigurationDto.name
        sourceConfiguration.sources = updateSourceConfigurationDto.sources
        return await this.sourceConfigurationRepository.save(
            sourceConfiguration
        )
    }

    async remove(uuid: string) {
        const sourceConfiguration =
            await this.sourceConfigurationRepository.findOne({
                where: { uuid }
            })
        return await this.sourceConfigurationRepository.remove(
            sourceConfiguration
        )
    }
}
