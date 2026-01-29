import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, DatabaseService],
  exports: [UsersService],
})
export class UsersModule {}
