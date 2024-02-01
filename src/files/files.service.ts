import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FileEntity, FileType } from './entities/file.entity'
import { Repository } from 'typeorm'
import { unlinkSync } from 'fs'
@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
  ) {}

  async getAll(id) {
    return this.repository.find()
  }

  async findAll(id: number, fileType: FileType) {
    try {
      const qb = await this.repository.createQueryBuilder('file')

      qb.where('file.userId = :userId', { id })

      if (fileType === FileType.PHOTOS) {
        qb.andWhere('file.mimetype ILIKE :type', { type: '%image%' })
      }

      if (fileType === FileType.TRASH) {
        qb.withDeleted().andWhere('file.deletedAt IS NOT NULL')
      }

      return qb.getMany()
    } catch (err) {
      throw new HttpException('Ошибка при получении изображений', HttpStatus.FORBIDDEN)
    }
  }
  async create(file: Express.Multer.File, id: number) {
    try {

      await this.repository.save({
        filename: file.originalname,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        user: { id: id },
      })

      return { text: 'изображение добавлено' }
    } catch (err) {
      throw new HttpException('Ошибка при добавлении', HttpStatus.FORBIDDEN)
    }
  }
  async findById(id: number) {
    return await this.repository.findOneBy({
      id,
    })
  }
  async delete(id, dto: any) {

    try {
      const fileToDelete = await this.findById(+dto.id)

      if (!fileToDelete) throw new HttpException('Файл не найден', HttpStatus.FORBIDDEN)
      if (fileToDelete) {
        unlinkSync(`./uploads/${fileToDelete.filename}`)
        await this.repository.remove(fileToDelete)
        return {
          text: ' файл удален',
        }
      }
    } catch (err) {}
  }
}
