import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/fleet';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        // Demo mode: accept any credentials
        if (username && password) {
          const mockUser: User = {
            id: '1',
            username,
            email: `${username}@fleetops.io`,
            role: 'admin',
          };
          const mockToken = btoa(`${username}:${Date.now()}`);
          
          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'fleet-auth',
    }
  )
);
