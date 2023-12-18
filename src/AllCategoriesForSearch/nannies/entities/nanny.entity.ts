import { Entity } from 'typeorm'
import { PostEntity } from '../../../posts/entities/post.entity'

@Entity('nannies')
export class NannyEntity extends PostEntity {}
