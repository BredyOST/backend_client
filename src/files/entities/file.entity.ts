import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum FileType {
  PHOTOS = 'photos',
  TRASH = 'trash',
}

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  filename: string

  @Column()
  originalName: string

  @Column()
  size: number

  @Column()
  mimetype: string

  // @ManyToOne(() => UserEntity, (user) => user.files)
  // user: UserEntity;

  @DeleteDateColumn()
  deletedAt?: Date
}
