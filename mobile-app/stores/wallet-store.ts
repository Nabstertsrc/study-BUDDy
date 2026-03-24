import { create } from 'zustand';
import { databaseService } from '../services/database-service';

interface WalletState {
    balance: number;
    isLoading: boolean;
    error: string | null;
    init: () => Promise<void>;
    addCredits: (amount: number) => Promise<void>;
    useCredit: () => Promise<boolean>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    balance: 0,
    isLoading: false,
    error: null,

    init: async () => {
        set({ isLoading: true });
        try {
            const balance = await databaseService.getBalance();
            set({ balance, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to load wallet balance', isLoading: false });
        }
    },

    addCredits: async (amount: number) => {
        set({ isLoading: true });
        try {
            const newBalance = await databaseService.updateBalance(amount);
            set({ balance: newBalance, isLoading: false });

            // Log transaction to notifications
            await databaseService.saveNotification({
                id: `topup_${Date.now()}`,
                type: 'achievement',
                title: 'Credits Activated!',
                message: `Successfully added ${amount} AI credits to your account.`,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            set({ error: 'Failed to update balance', isLoading: false });
        }
    },

    useCredit: async () => {
        const { balance } = get();
        if (balance <= 0) return false;

        try {
            const newBalance = await databaseService.updateBalance(-1);
            set({ balance: newBalance });
            return true;
        } catch (error) {
            console.error('Failed to use credit:', error);
            return false;
        }
    },
}));
