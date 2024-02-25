import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  user_id: string
  @Column()
  id_payment: string
  @Column({ default: null })
  titleCard: string
  @Column()
  payment_method: string
  @Column()
  status: string
  @Column()
  title: string
  @Column()
  amount: number
  @Column()
  type: string
  @Column('jsonb', { array: false, default: [] })
  category: PurchasedCategory[]
  @CreateDateColumn({ default: null })
  paymentAt: Date
  @CreateDateColumn()
  createdAt: Date
}

export interface PurchasedCategory {
  id: number // id купленной категории
  category: string // Имя купленной категории
  purchaseBuyDate: Date // Дата покупки
  purchaseEndDate: Date // Дата окончания подписки
  purchasePeriod: number
  price: number
}
