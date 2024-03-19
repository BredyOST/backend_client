import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import { createClient, RedisClientType } from 'redis'
import { replaceJsonWithBase64, reviveFromBase64Representation } from '@neshca/json-replacer-reviver'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RedisService {
  private readonly client: RedisClientType
  private isConnected = false
  constructor(private configService: ConfigService) {
    // console.log('Creating Redis client...')

    const password = encodeURIComponent(this.configService.get<string>('PASSWORD_REDIS'))
    const redisPath = this.configService.get<string>('PATH_REDIS')
    // const redisPath = process.env['PATH_REDIS']
    const redisAddress = this.configService.get<string>('ADRESS_REDIS')
    // console.log(redisPath)

    const config = {
      url: `rediss://:${password}${redisAddress}`,
      socket: {
        tls: true,
        rejectUnauthorized: true,
        ca: [fs.readFileSync(`${redisPath}`).toString()],
        },
    }
    this.client = createClient(config)
    this.client
      .connect()
      .then(() => {
        this.isConnected = true
        // console.log('Redis client connected.')
      })
      .catch((err) => {
        console.error('Redis connection error:', err)
      })
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      // console.warn('Redis client is not connected.')
      return null
    }
    try {
      let result;
      if(key) {
        result = (await this.client.get(key)) ?? null;
      }
      if (!result) {
        return null;
      }

      return JSON.parse(result, reviveFromBase64Representation);
    } catch (error) {
      // console.error('cache.get', error);
      return null;
    }

    // try {
    //   const product = await this.client.get(key)
    //   const encodedBody = JSON.parse(product, reviveFromBase64Representation)
    //
    //   if (key.includes('id')) {
    //     return encodedBody
    //   } else {
    //     const decodedBody = Buffer.from(encodedBody?.value?.data?.body, 'base64').toString('utf-8')
    //     return decodedBody
    //   }
    // } catch (err) {
    //   console.error('Redis get error:', err)
    //   return null
    // }
  }

  // async set(key: string, value: string): Promise<void> {
  //   // await this.client.connect();
  //   await this.client.set(key, value)
  // }

  async set(key: string, value: any, ttl?: number): Promise<void> {

    try {

      if (typeof ttl === 'number') {
        await this.client.set(
            key,
            JSON.stringify(value, replaceJsonWithBase64),
            { EX: ttl });
      } else {
        await this.client.set(
            key,
            JSON.stringify(value, replaceJsonWithBase64)
        );
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async getAllKeys(pattern) {
    let cursor = 0
    let keys = []

    do {
      const reply = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100
      });
      cursor = reply.cursor // Прямое присваивание, так как cursor уже является числом

      keys.push(...reply.keys)
    } while (cursor !== 0)

    return keys
  }

  async rename(oldKey: string, newKey: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('Redis client is not connected.')
      return
    }

    try {
      await this.client.rename(oldKey, newKey)
    } catch (error) {
      if (error.message === 'ERR no such key') {
        console.warn(`Redis rename error: Key '${oldKey}' does not exist.`)
      } else {
        console.error('Redis rename error:', error)
      }
    }
  }

  // async deleteKeysByPattern(pattern: string): Promise<void> {
  //   if (!this.isConnected) {
  //     console.warn('Redis client is not connected.');
  //     return;
  //   }
  //
  //   let cursor = 0; // Изменено на число
  //   do {
  //     // Используйте SCAN для поиска ключей по шаблону
  //     const reply = await this.client.scan(cursor, {
  //       MATCH: pattern,
  //       COUNT: 100,
  //     });
  //     cursor = reply[0]; // Обновление курсора
  //     const keys = reply[1]; // Получение ключей
  //
  //     // Удалите найденные ключи
  //     if (keys.length > 0) {
  //       await this.client.del(...keys);
  //     }
  //   } while (cursor !== '0');
  // }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.client.quit()
    }
  }

}
