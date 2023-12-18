import { ApiProperty } from '@nestjs/swagger'
export class AuthUserDto {
  @ApiProperty({ default: 'a@mail.ru' })
  email: string

  @ApiProperty()
  phoneNumber: string

  @ApiProperty({ default: '12345' })
  password: string
}
