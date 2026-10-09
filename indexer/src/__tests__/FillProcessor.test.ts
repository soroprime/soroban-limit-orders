import { FillProcessor } from '../processors/FillProcessor';

describe('FillProcessor', () => {
  let processor: FillProcessor;
  const mockAxios = { post: jest.fn() };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('axios', () => ({
      ...jest.requireActual('axios'),
      default: {
        post: mockAxios.post,
        create: () => ({ post: mockAxios.post }),
      },
    }));
    processor = new FillProcessor('http://localhost:3001');
    jest.clearAllMocks();
  });

  it('calls orderbook internal API on fill', async () => {
    mockAxios.post.mockResolvedValueOnce({ status: 200 });

    await processor.process({
      type: 'fill',
      orderId: 'order-123',
      maker: 'GAAA...',
      nonce: 1,
      amountOut: 1000000n,
      keeperFee: 10n,
      dex: 'soroswap',
      txHash: 'tx-hash-123',
    });

    expect(mockAxios.post).toHaveBeenCalledWith(
      'http://localhost:3001/internal/orders/order-123/fill',
      expect.objectContaining({
        txHash: 'tx-hash-123',
        fillPrice: expect.any(String),
      }),
      expect.any(Object)
    );
  });

  it('handles errors gracefully', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Not found'));

    await expect(
      processor.process({
        type: 'fill',
        orderId: 'order-123',
        maker: 'GAAA...',
        nonce: 1,
        amountOut: 1000000n,
        keeperFee: 10n,
        dex: 'soroswap',
        txHash: 'tx-hash-123',
      })
    ).resolves.not.toThrow();
  });
});