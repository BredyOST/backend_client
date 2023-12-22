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
    console.log('Creating Redis client...')

    const password = encodeURIComponent(this.configService.get<string>('PASSWORD_REDIS'))
    const redisPath = this.configService.get<string>('PATH_REDIS')
    const redisAddress = this.configService.get<string>('ADRESS_REDIS')

    const config = {
      url: `rediss://:${password}@master.5a8ea7e5-5c92-4bc2-822f-94bf61acf9c9.c.dbaas.selcloud.ru:6380`,
      socket: {
        tls: true,
        rejectUnauthorized: true,
        ca: [fs.readFileSync('/var/www/ClientBack/.redis/root.crtgit add .').toString()],
      },
    }
    this.client = createClient(config)
    this.client
      .connect()
      .then(() => {
        this.isConnected = true
        console.log('Redis client connected.')
      })
      .catch((err) => {
        console.error('Redis connection error:', err)
      })
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      console.warn('Redis client is not connected.')
      return null
    }



    try {
      const result = (await this.client.get(key)) ?? null;

      if (!result) {
        return null;
      }

      // use reviveFromBase64Representation to restore binary data from Base64
      return JSON.parse(result, reviveFromBase64Representation);
    } catch (error) {
      console.error('cache.get', error);
      return null;
    }
    //
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
    //
    //
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
      console.log(cursor)
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
