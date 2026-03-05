import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAdmin } = useAuth();
    
    if (!isAdmin) {
        // Redirect to home since login is now a popup in TopNav
        return <Navigate to="/" replace />;
    }

    return children;
}
