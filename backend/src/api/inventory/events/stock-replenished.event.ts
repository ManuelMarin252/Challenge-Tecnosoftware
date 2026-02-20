export class StockReplenishedEvent {
  constructor(
    public readonly productId: number,
    public readonly quantity: number,
    public readonly userId: number,
    public readonly reason: string,
  ) {}
}
