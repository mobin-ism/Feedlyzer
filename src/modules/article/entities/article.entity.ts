import { CustomBaseEntity } from 'src/common/entity/custom-base.entity'
import { Column, Entity, OneToOne } from 'typeorm'
import { ArticleInsight } from './article-insight.entity'

@Entity()
export class Article extends CustomBaseEntity {
    @Column({
        type: 'varchar',
        length: 255,
        nullable: false
    })
    title: string

    @Column({
        type: 'text',
        nullable: true
    })
    description: string

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    publicationDate: string

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true
    })
    sourceUrl: string

    @OneToOne(
        () => ArticleInsight,
        (articleInsight) => articleInsight.article,
        {
            cascade: true
        }
    )
    insights: ArticleInsight

    @Column({
        type: 'boolean',
        nullable: false,
        default: false
    })
    isProcessed: boolean
}
