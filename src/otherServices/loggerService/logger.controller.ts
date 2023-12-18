import { Controller } from '@nestjs/common'
import { LogsService } from './logger.service'

@Controller('logs')
export class LogsController {
  constructor(private readonly loggerService: LogsService) {}

  // @Get('error')
  // async getErrorLogs() {
  //     const logs = await this.loggerService.getErrorLogs();
  //     return { logs };
  // }
  //
  // @Get('info')
  // async getInfoLogs() {
  //     const logs = await this.loggerService.getInfoLogs();
  //     return { logs };
  // }
}
