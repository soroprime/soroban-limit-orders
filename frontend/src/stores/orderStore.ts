import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type OrderType = 'limit_buy' | 'limit_sell' | 'stop_loss' | 'take_profit';

interface OrderState {
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  tokenIn: string;
  setTokenIn: (token: string) => void;
  tokenOut: string;
  setTokenOut: (token: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  targetPrice: string;
  setTargetPrice: (price: string) => void;
  keeperFee: number;
  setKeeperFee: (fee: number) => void;
  expiry: number;
  setExpiry: (expiry: number) => void;
}

const TOKENS = [
  { address: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH', symbol: 'USDC', decimals: 6 },
  { address: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBI', symbol: 'XLM', decimals: 7 },
  { address: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', symbol: 'BTC', decimals: 8 },
];

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orderType: 'limit_buy',
      setOrderType: (orderType) => set({ orderType }),
      tokenIn: TOKENS[0].address,
      setTokenIn: (tokenIn) => set({ tokenIn }),
      tokenOut: TOKENS[1].address,
      setTokenOut: (tokenOut) => set({ tokenOut }),
      amount: '',
      setAmount: (amount) => set({ amount }),
      targetPrice: '',
      setTargetPrice: (targetPrice) => set({ targetPrice }),
      keeperFee: 0.1,
      setKeeperFee: (keeperFee) => set({ keeperFee }),
      expiry: Date.now() + 3600 * 1000,
      setExpiry: (expiry) => set({ expiry }),
    }),
    { name: 'order-store' }
  )
);

export { TOKENS };