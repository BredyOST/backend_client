import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { catchError, firstValueFrom } from 'rxjs'
import { AxiosError } from 'axios/index'

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)
  constructor(private readonly httpService: HttpService) {}

  async findPost(): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService
        .get<any>('https://api.vk.com/method/wall.get?owner_id=-198838959&count=5&offset=10&access_token=08ed89a008ed89a008ed89a0f00bf82736008ed08ed89a06de41f5d7e95a7d62639387a&v=5.131')
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data)
            throw 'An error happened!'
          }),
        ),
    )
    return data
  }
}
