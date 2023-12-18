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
  price: number
  @Column()
  period: number
  @Column()
  description: string
  @Column()
  sale: boolean
  @Column()
  percentForSale: number
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
