import React, { createContext, useContext, useState, useEffect } from 'react';
import { baseUrl } from '../baseUrl';
import useStore from '../store/store';

const ShiftContext = createContext();

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};

export const ShiftProvider = ({ children }) => {
  const agent = useStore(state => state.agent);
  const [shiftStatus, setShiftStatus] = useState('not_started'); // not_started, active, on_break, ended
  const [shiftData, setShiftData] = useState(null);
  const [shiftTimer, setShiftTimer] = useState(0);
  const [breakTimer, setBreakTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch today's shift on mount and when agent changes
  useEffect(() => {
    if (agent?._id || agent?.id) {
      fetchTodayShift();
    }
  }, [agent?._id, agent?.id]);

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (shiftData && shiftData.status === 'active' && shiftData.startTime) {
        const elapsed = Math.floor((new Date() - new Date(shiftData.startTime)) / 1000);
        const totalBreakTime = shiftData.breaks?.reduce((sum, b) => sum + (b.duration || 0), 0) || 0;
        setShiftTimer(elapsed - totalBreakTime);
      }

      if (shiftData && shiftData.status === 'on_break' && shiftData.breaks?.length > 0) {
        const lastBreak = shiftData.breaks[shiftData.breaks.length - 1];
        if (lastBreak && !lastBreak.endTime) {
          const elapsed = Math.floor((new Date() - new Date(lastBreak.startTime)) / 1000);
          setBreakTimer(elapsed);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [shiftData]);

  const fetchTodayShift = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/shifts/today/${agent._id || agent.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.shift) {
          setShiftData(data.shift);
          setShiftStatus(data.shift.status);
        } else {
          setShiftData(null);
          setShiftStatus('not_started');
        }
      }
    } catch (err) {
      console.error('Error fetching shift:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/shifts/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: agent._id || agent.id })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('active');
        return { success: true, shift: data.shift };
      } else {
        setError(data.error || 'Failed to clock in');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error clocking in:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/shifts/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: agent._id || agent.id })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('ended');
        setShiftTimer(0);
        return { success: true, shift: data.shift };
      } else {
        setError(data.error || 'Failed to clock out');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error clocking out:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const startBreak = async (breakType = 'short') => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/shifts/start-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          agentId: agent._id || agent.id,
          breakType 
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('on_break');
        return { success: true, shift: data.shift };
      } else {
        setError(data.error || 'Failed to start break');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error starting break:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const endBreak = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/shifts/end-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: agent._id || agent.id })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('active');
        setBreakTimer(0);
        return { success: true, shift: data.shift };
      } else {
        setError(data.error || 'Failed to end break');
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error ending break:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    shiftStatus,
    shiftData,
    shiftTimer,
    breakTimer,
    loading,
    error,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    fetchTodayShift,
    formatTime,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};
