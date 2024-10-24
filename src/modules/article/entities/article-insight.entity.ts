import { CustomBaseEntity } from 'src/common/entity/custom-base.entity'
import { Column, Entity, ManyToOne } from 'typeorm'
import { Article } from './article.entity'

@Entity()
export class ArticleInsight extends CustomBaseEntity {
    @Column({
        type: 'int',
        nullable: false
    })
    articleId: number

    @ManyToOne(() => Article, (article) => article.insights, {
        onDelete: 'CASCADE'
    })
    article: Article

    @Column({
        type: 'text',
        nullable: true
    })
    topics: string

    @Column({
        type: 'text',
        nullable: true
    })
    keywords: string

    @Column({
        type: 'text',
        nullable: true
    })
    people: string

    @Column({
        type: 'text',
        nullable: true
    })
    organizations: string

    @Column({
        type: 'text',
        nullable: true
    })
    locations: string

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true
    })
    category: string
}
