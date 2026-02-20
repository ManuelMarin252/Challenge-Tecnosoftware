import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';

@Module({
  controllers: [EventsController],
  providers: [],
})
export class EventsModule {}
