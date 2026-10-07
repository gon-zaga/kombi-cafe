// Persisted table selection: stores which table the customer is at
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface TableState {
  selectedTable: number | null;
  setTable: (tableNumber: number) => void;
  clearTable: () => void;
}

export const useTableStore = create<TableState>()(
  persist(
    (set) => ({
      selectedTable: null,
      setTable: (tableNumber) => set(() => ({ selectedTable: tableNumber })),
      clearTable: () => set(() => ({ selectedTable: null })),
    }),
    {
      name: 'table-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)