import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  id_category: string
  @Column()
  name: string
  @Column()
  description: string
  @Column('jsonb', { array: false, default: [] })
  positiveWords: string[]
  @Column('jsonb', { array: false, default: [] })
  negativeWords: string[]
  @Column('jsonb', { array: false, default: [] })
  extraWords: ExtraWords[]
  @Column('jsonb', { array: false, default: [] })
  chatNames: string[]
  @Column({ default: 2500 })
  salary: number
  @Column({ default: 0 })
  salaryChanel: number
  @Column({ default: 0 })
  percentSale: number
  @Column({ default: false })
  show: boolean
  @Column({ default: false })
  create: boolean
  @Column({ default: true })
  disabled: boolean
  @Column({ default: false })
  channelActive: boolean
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}

export interface ExtraWords {
  id: number // id купленной категории
  word: string // Имя купленной категории
  dateLast: Date // Дата последнего поста
  dateUpdate: Date // Дата обновления
}

