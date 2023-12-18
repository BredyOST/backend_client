import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('groupsFromVk')
export class GroupsFromVkEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  idVk: string
  @Column({
    default: 'vk',
  })
  @Column({ nullable: true })
  postsLastDate: Date
  @Column({ nullable: true })
  postsDateWhenUpdate: Date
  @Column({ nullable: true })
  postsCounter: number
  @Column({ nullable: true })
  isClosed: boolean
  @Column({ nullable: true })
  old: boolean
  @Column({ nullable: true })
  name: string
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
