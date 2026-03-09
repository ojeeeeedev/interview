import { createContext } from 'react';

export interface AuthContextType {
    isAdmin: boolean;
    login: (password: string) => boolean;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
