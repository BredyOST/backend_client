import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as heapdump from 'heapdump';
import * as path from 'path';

@Injectable()
export class HeapdumpMiddleware implements NestMiddleware {
    constructor() {
        // Создание дампа кучи при старте проекта
        this.createHeapdump();

        // Устанавливаем интервал для создания дампа кучи каждые 10 минут
        // setInterval(this.createHeapdump.bind(this), 1 * 60 * 1000); // 10 минут в миллисекундах
    }

    use(req: Request, res: Response, next: NextFunction) {
        next();
    }

    private createHeapdump() {
        // Генерируем имя файла с дампом кучи
        const dumpFile = path.join('D:/WEB/search-back/src/middleware', `heapdump-${Date.now().toString()}.heapsnapshot`);

        // Создаем дамп кучи
        heapdump.writeSnapshot(dumpFile, (err: Error | null) => {
            if (err) {
                console.error('Error creating heap snapshot:', err);
            } else {
                console.log('Heap snapshot created:', dumpFile);
            }
        });
    }
}
