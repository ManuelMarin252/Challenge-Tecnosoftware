export class StockChangedEvent {
  constructor(
    public readonly productId: number,
    public readonly newStock: number,
    public readonly oldStock: number,
  ) {}
}
