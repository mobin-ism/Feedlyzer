import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SourceConfiguration } from './entities/source-configuration.entity'
import { SourceConfigurationController } from './source-configuration.controller'
import { SourceConfigurationService } from './source-configuration.service'

@Module({
    imports: [TypeOrmModule.forFeature([SourceConfiguration])],
    controllers: [SourceConfigurationController],
    providers: [SourceConfigurationService],
    exports: [SourceConfigurationService]
})
export class SourceConfigurationModule {}
