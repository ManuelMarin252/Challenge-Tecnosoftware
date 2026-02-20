export class ProductSoldEvent {
  constructor(
    public readonly productId: number,
    public readonly quantity: number,
    public readonly userId: number,
    public readonly totalAmount: number,
  ) {}
}
