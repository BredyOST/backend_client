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
  @Column({ default: 2500})
  salary: number
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
