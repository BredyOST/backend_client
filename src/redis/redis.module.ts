import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as dotenv from 'dotenv'
dotenv.config()
//
@Module({
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule {}