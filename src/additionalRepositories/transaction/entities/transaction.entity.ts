import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  user_id: string
  @Column()
  title: string
  @Column()
  amount: number
  @Column()
  type: string
  @Column()
  category: string

  @CreateDateColumn()
  createdAt: Date
}
