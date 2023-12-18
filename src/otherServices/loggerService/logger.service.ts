import { Inject, Injectable } from '@nestjs/common'
import * as winston from 'winston'
import * as DailyRotateFile from 'winston-daily-rotate-file'
import * as readline from 'readline'
import * as fs from 'fs' // Пример использования Daily Rotate File

@Injectable()
export class LogsService {
  private logger: winston.Logger
  private repositoryName: string

  constructor(@Inject('RepositoryNameTokenPostsAdd') repositoryName: string) {
    this.repositoryName = repositoryName
    this.logger = winston.createLogger({
      // Настройки логгера winston
      transports: [
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/error-%DATE%.log`,
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/info-%DATE%.log`,
          level: 'info',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
      ],
    })
  }

  log(message: string) {
    this.logger.log({
      level: 'info',
      message,
    })
  }

  error(message: string, trace: string) {
    this.logger.error({
      level: 'error',
      message,
      trace,
    })
  }

  async getErrorLogs(): Promise<string[]> {
    // Путь к файлу с журналами ошибок
    const logFilePath = `./logs/${this.repositoryName}/error-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading error log file:', error)
      return []
    }
  }

  async getInfoLogs(): Promise<string[]> {
    // Путь к файлу с журналами информации
    const logFilePath = `./logs/${this.repositoryName}/info-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading info log file:', error)
      return []
    }
  }
}

@Injectable()
export class LogsServiceAddTutors {
  private logger: winston.Logger
  private repositoryName: string

  constructor(@Inject('RepositoryNameTokenTutorsAdd') repositoryName: string) {
    this.repositoryName = repositoryName
    this.logger = winston.createLogger({
      // Настройки логгера winston
      transports: [
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/error-%DATE%.log`,
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/info-%DATE%.log`,
          level: 'info',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
      ],
    })
  }

  log(message: string) {
    this.logger.log({
      level: 'info',
      message,
    })
  }

  error(message: string, trace: string) {
    this.logger.error({
      level: 'error',
      message,
      trace,
    })
  }

  async getErrorLogs(): Promise<string[]> {
    // Путь к файлу с журналами ошибок
    const logFilePath = `./logs/${this.repositoryName}/error-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading error log file:', error)
      return []
    }
  }

  async getInfoLogs(): Promise<string[]> {
    // Путь к файлу с журналами информации
    const logFilePath = `./logs/${this.repositoryName}/info-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading info log file:', error)
      return []
    }
  }
}

@Injectable()
export class LogsServiceAddNannies {
  private logger: winston.Logger
  private repositoryName: string

  constructor(@Inject('RepositoryNameTokenNanniesAdd') repositoryName: string) {
    this.repositoryName = repositoryName
    this.logger = winston.createLogger({
      // Настройки логгера winston
      transports: [
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/error-%DATE%.log`,
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/info-%DATE%.log`,
          level: 'info',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
      ],
    })
  }

  log(message: string) {
    this.logger.log({
      level: 'info',
      message,
    })
  }

  error(message: string, trace: string) {
    this.logger.error({
      level: 'error',
      message,
      trace,
    })
  }

  async getErrorLogs(): Promise<string[]> {
    // Путь к файлу с журналами ошибок
    const logFilePath = `./logs/${this.repositoryName}/error-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading error log file:', error)
      return []
    }
  }

  async getInfoLogs(): Promise<string[]> {
    // Путь к файлу с журналами информации
    const logFilePath = `./logs/${this.repositoryName}/info-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading info log file:', error)
      return []
    }
  }
}

@Injectable()
export class LogsServiceOtherErrors {
  private logger: winston.Logger
  private repositoryName: string

  constructor(@Inject('RepositoryNameTokenOtherAdd') repositoryName: string) {
    this.repositoryName = repositoryName
    this.logger = winston.createLogger({
      // Настройки логгера winston
      transports: [
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/error-%DATE%.log`,
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
        new DailyRotateFile({
          filename: `logs/${this.repositoryName}/info-%DATE%.log`,
          level: 'info',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '50m',
        }),
      ],
    })
  }

  log(message: string) {
    this.logger.log({
      level: 'info',
      message,
    })
  }

  error(indicator: string, message: string, trace: string) {
    const timestamp = new Date()
    this.logger.error({
      level: 'error',
      message: `${indicator} в ${timestamp}, text: ${message}`,
      trace,
    })
  }

  async getErrorLogs(): Promise<string[]> {
    // Путь к файлу с журналами ошибок
    const logFilePath = `./logs/${this.repositoryName}/error-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading error log file:', error)
      return []
    }
  }

  async getInfoLogs(): Promise<string[]> {
    // Путь к файлу с журналами информации
    const logFilePath = `./logs/${this.repositoryName}/info-${new Date().toDateString()}.log`

    // Массив для хранения логов
    const logs: string[] = []

    try {
      const fileStream = fs.createReadStream(logFilePath)

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })

      // Чтение каждой строки из файла логов
      for await (const line of rl) {
        logs.push(line)
      }

      return logs
    } catch (error) {
      console.error('Error reading info log file:', error)
      return []
    }
  }
}
