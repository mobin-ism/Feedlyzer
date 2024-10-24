import { CustomBaseEntity } from 'src/common/entity/custom-base.entity'
import { Column, Entity } from 'typeorm'

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
        nullable: true
    })
    sourceUrl: string
}
