import { Controller, Post, Body, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, Get, UseGuards, Delete } from '@nestjs/common'
import { FilesService } from './files.service'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { fileStorage } from './storage'
import { JwtAuthGuard } from '../auth/guards/jwt.guard'
import { UserId } from '../decorators/user-id.decorator'

@Controller('files')
@ApiTags('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // @Get()
  // findAll(@UserId() id: number, @Query('type') fileType: FileType) {
  //   return this.filesService.findAll(id, fileType);
  // }

  @Get('/getAll')
  @UseGuards(JwtAuthGuard)
  getAll(@UserId() id: number) {
    return this.filesService.getAll(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 })],
      }),
    )
    file: Express.Multer.File,
    @UserId() id: number,
  ) {
    return this.filesService.create(file, id)
  }

  @Delete('/delete')
  @UseGuards(JwtAuthGuard)
  delete(@UserId() id: number, @Body() dto: any) {
    return this.filesService.delete(id, dto)
  }
  // @Delete()
  // @UseGuards(JwtAuthGuard)
  // remove(@UserId() id: number, @Query('ids') ids: string) {
  //   // files?ids=1,2,7,8
  //   return this.filesService.remove(id, ids);
  // }
}
