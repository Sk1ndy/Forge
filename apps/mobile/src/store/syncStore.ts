import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAttempt: string | null;
  setOnlineStatus: (status: boolean) => void;
  setSyncing: (status: boolean) => void;
  setPendingCount: (count: number) => void;
  recordSyncAttempt: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSyncAttempt: null,
      setOnlineStatus: (status) => set({ isOnline: status }),
      setSyncing: (status) => set({ isSyncing: status }),
      setPendingCount: (count) => set({ pendingCount: count }),
      recordSyncAttempt: () => set({ lastSyncAttempt: new Date().toISOString() }),
    }),
    {
      name: 'forge-sync-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
