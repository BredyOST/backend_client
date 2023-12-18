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
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
