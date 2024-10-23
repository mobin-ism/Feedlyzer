import { DocumentBuilder } from '@nestjs/swagger'

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Feedlyzer: Advanced RSS Aggregation and Topic Analysis')
    .setDescription('This is the collection of APIs.')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build()
