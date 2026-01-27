import { Injectable } from '@nestjs/common';
import {neon} from '@neondatabase/serverless';
import {ConfigService} from '@nestjs/config'

@Injectable()
export class DatabaseService {
    private readonly sql: ReturnType<typeof neon>;
    constructor(private configService: ConfigService) {
        const databaseUrl = this.configService.getOrThrow('DATABASE_URL');
        this.sql = neon(databaseUrl);
    }
    async getData (){
        const data = await this.sql`...`;
        return data;
    }
}
