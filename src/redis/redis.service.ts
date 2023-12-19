import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { createClient, RedisClientType } from 'redis';
import { reviveFromBase64Representation } from '@neshca/json-replacer-reviver'
import * as process from 'process';
@Injectable()
export class RedisService {
    private readonly client: RedisClientType;
    private isConnected: boolean = false;
    constructor() {
        console.log('Creating Redis client...');
        console.log(process.env["PATH_REDIS"]);
        const password = encodeURIComponent(process.env["PASSWORD_REDIS"]);
        const config = {
            url: `rediss://:${password}${process.env['ADRESS_REDIS']}`,
            socket: {
                tls: true,
                rejectUnauthorized: true,
                ca: [fs.readFileSync(process.env["PATH_REDIS"]).toString()],
            }
        };
        this.client = createClient(config);
        this.client.connect().then(() => {
            this.isConnected = true;
            console.log('Redis client connected.');
        }).catch((err) => {
            console.error('Redis connection error:', err);
        });
    }


    async get(key: string): Promise<string | null> {
        if (!this.isConnected) {
            console.warn('Redis client is not connected.');
            return null;
        }
        try {
            // await this.client.connect();
            const product = await this.client.get(key)
            const encodedBody = JSON.parse(product, reviveFromBase64Representation)
            const decodedBody = Buffer.from(encodedBody.value.data.body, 'base64').toString('utf-8');
            return decodedBody
        } catch (err) {
            console.error('Redis get error:', err);
            return null;
        }
        // finally {
        //     this.client.quit();
        // }

  }

    async set(key: string, value: string): Promise<void> {
        // await this.client.connect();
        await this.client.set(key, value);
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.client.quit();
        }
    }

    // Другие методы для работы с Redis
}