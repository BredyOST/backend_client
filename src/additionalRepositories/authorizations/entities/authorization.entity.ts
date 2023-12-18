import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('authorization')
export class AuthorizationEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  userId: number
  @Column()
  userMail: string
  @Column()
  clientIp: string
  @Column()
  userAgent: string
  @Column()
  status: boolean
  @Column()
  sessionToken: string
  @Column()
  loginAt: Date
  @CreateDateColumn()
  createdAt: Date
}
