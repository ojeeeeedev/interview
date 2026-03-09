import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import React from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAdmin } = useAuth();
    
    if (!isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
