import { create } from 'zustand';

type NetworkState = {
  online: boolean;
  checked: boolean;
  setOnline: (online: boolean) => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  online: true,
  checked: false,
  setOnline: (online) => set({ online, checked: true }),
}));
