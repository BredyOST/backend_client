import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column({ unique: true })
  email: string
  @Column({ default: '' })
  forChangeEmail: string
  @Column({ default: '' })
  phoneNumber: string
  @Column({ default: '' })
  forChangePhoneNumber: string
  @Column()
  password: string

  @Column({ default: '' })
  fullName: string

  @Column({ default: false })
  isAdmin: boolean
  @Column({ default: false })
  isMainAdmin: boolean
  @Column({ default: false })
  isActivatedEmail: boolean
  @Column({ default: false })
  isActivatedPhone: boolean
  @Column({ default: false })
  activatedFreePeriod: boolean
  @Column({ default: false })
  endFreePeriod: boolean

  @Column({ default: false })
  activatedFreePeriodNotification: boolean
  @Column({ default: false })
  endFreePeriodNotification: boolean

  @Column({ default: '' })
  sessionToken: string
  @Column({ default: '' })
  ip: string
  @Column({ default: null })
  lastVisit: null | Date
  @Column({ default: '' })
  activationLink: string
  @Column({ default: '' })
  activationNumber: string
  @Column({ default: '' })
  activationTgNumber: string
  @Column('jsonb', { array: false, default: [] })
  categoriesFreePeriod: PurchasedCategory[]
  @Column('jsonb', { array: false, default: [] })
  notificationsFreePeriod: PurchasedCategory[]
  @Column('jsonb', { array: false, default: [] })
  categoriesHasBought: PurchasedCategory[]
  @Column('jsonb', { array: false, default: [] })
  notificationsHasBought: PurchasedCategory[]
  @Column({ nullable: true })
  timeCallVerify: Date
  @Column({ nullable: true })
  timeSendMessageVerify: Date
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
  @DeleteDateColumn()
  deletedAt: Date
}

export interface PurchasedCategory {
  id: number // id купленной категории
  category: string // Имя купленной категории
  purchaseBuyDate: Date // Дата покупки
  purchaseEndDate: Date // Дата окончания подписки
  purchasePeriod: number
}
