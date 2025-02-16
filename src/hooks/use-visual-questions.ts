import { create } from "zustand";

// Define the type for a Visual Question
type VisualQuestion = {
  id: string;
  question: string;
  type: string;
};

// Define the type for the store's state
type VisualQuestionState = {
  visualQuestions: VisualQuestion[];
  setVisualQuestions: (visualQuestions: VisualQuestion[]) => void;
  addVisualQuestion: (visualQuestion: VisualQuestion) => void;
  removeVisualQuestion: (visualQuestion: VisualQuestion) => void;
};

export const useVisualQuestionStore = create<VisualQuestionState>((set, get) => ({
  visualQuestions: [],
  setVisualQuestions: (visualQuestions) => set({ visualQuestions }),
  addVisualQuestion: (visualQuestion) =>
    set((state) => ({
      visualQuestions: [...state.visualQuestions, visualQuestion],
    })),
  removeVisualQuestion: (visualQuestion) =>
    set((state) => ({
      visualQuestions: state.visualQuestions.filter((q) => q.id !== visualQuestion.id),
    })),
}));
