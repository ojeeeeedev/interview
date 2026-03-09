import React, { useState } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState<boolean>(() => {
        return sessionStorage.getItem('isAdmin') === 'true';
    });

    const login = (password: string) => {
        if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
            setIsAdmin(true);
            sessionStorage.setItem('isAdmin', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        sessionStorage.removeItem('isAdmin');
    };

    return (
        <AuthContext.Provider value={{ isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
