import { Injectable } from '@nestjs/common';
import { CreateHandymanAndBuilderDto } from './dto/create-handyman-and-builder.dto';
import { UpdateHandymanAndBuilderDto } from './dto/update-handyman-and-builder.dto';

@Injectable()
export class HandymanAndBuilderService {
  create(createHandymanAndBuilderDto: CreateHandymanAndBuilderDto) {
    return 'This action adds a new handymanAndBuilder';
  }

  findAll() {
    return `This action returns all handymanAndBuilder`;
  }

  findOne(id: number) {
    return `This action returns a #${id} handymanAndBuilder`;
  }

  update(id: number, updateHandymanAndBuilderDto: UpdateHandymanAndBuilderDto) {
    return `This action updates a #${id} handymanAndBuilder`;
  }

  remove(id: number) {
    return `This action removes a #${id} handymanAndBuilder`;
  }
}
