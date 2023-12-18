import { Entity } from 'typeorm'
import { PostEntity } from '../../../posts/entities/post.entity'

@Entity('tutors')
export class TutorEntity extends PostEntity {}
