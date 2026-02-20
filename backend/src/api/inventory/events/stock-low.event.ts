export class StockLowEvent {
  constructor(
    public readonly productId: number,
    public readonly currentStock: number,
    public readonly minStock: number,
  ) {}
}
