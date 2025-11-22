import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../store/store';

const RequireAuth = ({ children }) => {
    const agent = useStore(state => state.agent);
    const fetchCurrentAgent = useStore(state => state.fetchCurrentAgent);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            if (!agent && !authChecked) {
                try {
                    await fetchCurrentAgent();
                } catch (error) {
                    console.error('Authentication check failed:', error);
                } finally {
                    setAuthChecked(true);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        checkAuth();

        // Re-check authentication periodically (every 5 minutes)
        const authCheckInterval = setInterval(async () => {
            try {
                await fetchCurrentAgent();
            } catch (error) {
                console.error('Periodic auth check failed:', error);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(authCheckInterval);
    }, [agent, fetchCurrentAgent, authChecked]);

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-300 text-lg">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!agent) {
        // Save the location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // User is authenticated, render the protected content
    return children;
};

export default RequireAuth;
