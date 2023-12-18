import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  email: string
  @Column()
  phoneNumber: string
  @Column()
  category: number
  @Column()
  categoryName: string
  @Column()
  purchaseBuyDate: Date
  @Column()
  purchaseEndDate: Date
  @Column()
  purchasePeriod: number
  @Column({ default: false })
  freePeriod: boolean

  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
