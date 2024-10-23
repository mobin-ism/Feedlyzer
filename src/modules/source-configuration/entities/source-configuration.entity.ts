import { CustomBaseEntity } from 'src/common/entity/custom-base.entity'
import { Column, Entity } from 'typeorm'

@Entity()
export class SourceConfiguration extends CustomBaseEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string

    @Column({ type: 'jsonb' })
    sources: string[]
}
