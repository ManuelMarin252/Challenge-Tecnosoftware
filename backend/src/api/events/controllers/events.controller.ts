import { Controller, Sse } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map, merge } from 'rxjs';
@Controller('events')
export class EventsController {
  constructor(private eventEmitter: EventEmitter2) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    const productCreated$ = fromEvent(
      this.eventEmitter,
      'product.created',
    ).pipe(
      map(
        (payload: any) =>
          ({
            data: { type: 'product.created', payload },
          } as MessageEvent),
      ),
    );

    const productSold$ = fromEvent(this.eventEmitter, 'product.sold').pipe(
      map(
        (payload: any) =>
          ({
            data: { type: 'product.sold', payload },
          } as MessageEvent),
      ),
    );

    const stockReplenished$ = fromEvent(
      this.eventEmitter,
      'stock.replenished',
    ).pipe(
      map(
        (payload: any) =>
          ({
            data: { type: 'stock.replenished', payload },
          } as MessageEvent),
      ),
    );

    const stockChanged$ = fromEvent(this.eventEmitter, 'stock.changed').pipe(
      map(
        (payload: any) =>
          ({
            data: { type: 'stock.changed', payload },
          } as MessageEvent),
      ),
    );

    return merge(
      productCreated$,
      productSold$,
      stockReplenished$,
      stockChanged$,
    );
  }
}

interface MessageEvent {
  data: string | object;
}
