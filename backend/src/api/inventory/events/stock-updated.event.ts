export class StockUpdatedEvent {
  constructor(
    public readonly productId: number,
    public readonly oldStock: number,
    public readonly newStock: number,
  ) {}
}
