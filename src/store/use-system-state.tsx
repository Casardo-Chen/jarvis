import { create } from 'zustand';

export type SystemState = 'planning' | 'execution';

interface SystemStateStore {
  systemState: SystemState;
  setSystemState: (newState: SystemState) => void;
  updateStateOnUserInput: (input: string) => void;
}

export const useSystemStateStore = create<SystemStateStore>((set) => ({
  systemState: 'planning',  // Initial state
  setSystemState: (newState) => set({ systemState: newState }),
  updateStateOnUserInput: (input) => {
    const newState = input.toLowerCase().includes('executing') ? 'execution' : 'planning';
    set({ systemState: newState });
  },
}));
