import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useOrgStore = create(
  persist(
    (set) => ({
      currentOrganizationId: null,
      setCurrentOrganizationId: (id) => set({ currentOrganizationId: id }),
    }),
    { name: 'taskflow-org' },
  ),
);
