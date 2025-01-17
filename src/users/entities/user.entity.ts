import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column({ unique: true, nullable: true })
  email: string
  @Column({ default: '', nullable: true })
  forChangeEmail: string
  @Column({ default: '' })
  phoneNumber: string
  @Column({ default: '' })
  forChangePhoneNumber: string
  @Column()
  password: string
  @Column({ default: '' })
  fullName: string
  @Column({ default: 0 })
  wallet: number
  @Column({ default: 0 })
  walletRef: number
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  access: AccessPosts
  @Column({ default: '' })
  chatIdTg: string
  @Column({ default: '' })
  userIdTg: string
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
  @Column({ default: '' })
  linkForAccessToTelegramChat: string
  @Column({ default: '' })
  activationCodeForChangePassword: string
  @Column({ default: '' })
  activationCodeForChangePasswordTg: string
  @Column({ default: '' })
  activationTgNumberToProfile: string
  @Column({ default: '' })
  salaryCount: string
  @Column({ default: '' })
  parentRefId: string
  @Column('jsonb', { array: false, default: [] })
  childrenRefId: number[]
  @Column('jsonb', { array: false, default: [] })
  categoriesFreePeriod: PurchasedCategory[]
  @Column('jsonb', { array: false, default: [] })
  notificationsFreePeriod: PurchasedCategoryNotifications[]
  @Column('jsonb', { array: false, default: [] })
  categoriesHasBought: PurchasedCategory[]
  @Column('jsonb', { array: false, default: [] })
  notificationsHasBought: PurchasedCategoryNotifications[]
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

export interface PurchasedCategoryNotifications {
  id: number // id купленной категории
  category: string // Имя купленной категории
  purchaseBuyDate: Date // Дата покупки
  purchaseEndDate: Date // Дата окончания подписки
  purchasePeriod: number
  chatList: string
}

export interface AccessPosts {
  '1': number[]
  '2': number[]
  '3': number[]
  '4': number[]
  '5': number[]
  '6': number[]
  '7': number[]
  '8': number[]
  '9': number[]
  '10': number[]
  '11': number[]
  '12': number[]
}
