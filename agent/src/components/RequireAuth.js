import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useStore from '../store/store';

const RequireAuth = ({ children }) => {
    const agent = useStore(state => state.agent);
    const fetchCurrentAgent = useStore(state => state.fetchCurrentAgent);

    useEffect(() => {
        if (!agent) {
            fetchCurrentAgent();
        }
    }, [agent, fetchCurrentAgent]);

    if (!agent) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

export default RequireAuth;
