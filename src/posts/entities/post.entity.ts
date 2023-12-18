import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number
  @Column()
  identification_post: string
  @Column()
  id_group: string
  @Column()
  name_group: string
  @Column()
  city_group: string
  @Column()
  country_group: string
  @Column()
  photo_100_group: string
  @Column()
  first_name_user: string
  @Column()
  last_name_user: string
  @Column()
  city_user: string
  @Column()
  country_user: string
  @Column()
  photo_100_user: string
  @Column()
  post_id: string
  @Column()
  post_owner_id: string
  @Column()
  post_fromId: string
  @Column()
  post_date_publish: string
  @Column()
  post_text: string
  @Column()
  post_type: string
  @Column()
  signer_id: string
  @CreateDateColumn()
  createdAt: Date
  @UpdateDateColumn()
  updateAt: Date
}
