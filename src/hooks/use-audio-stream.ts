import {create} from 'zustand';

interface AudioStreamState {
  isPlaying: boolean;
  setIsPlaying: (empty: boolean) => void;
}

export const useAudioStreamStore = create<AudioStreamState>((set) => ({
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({isPlaying}),
}));
