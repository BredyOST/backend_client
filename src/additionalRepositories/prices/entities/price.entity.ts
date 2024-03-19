import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('prices')
export class PriceEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  identificatorId: string
  @Column()
  title: string
  @Column()
  period: number
  @Column()
  description: string
  @Column({ default: '' })
  descriptionNotification: string
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
