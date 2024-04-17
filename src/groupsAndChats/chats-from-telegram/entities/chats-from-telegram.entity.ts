import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity(`chatsFromTelegram`)
export class ChatsFromTelegramEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  chatName: string
  @Column({
    default: 'tg',
  })
  identification: string
  @Column({ nullable: true })
  postsLastDate: Date
  @Column({ nullable: true })
  postsDateWhenUpdate: Date
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
