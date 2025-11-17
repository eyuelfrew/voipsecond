import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../config';
const baseUrl = getApiUrl();
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

  // Ref to track previous agent ID
  const previousAgentIdRef = useRef(null);

  // Get agent ID - support both _id and id
  const getAgentId = () => {
    if (!agent) return null;
    const agentId = agent._id || agent.id;
    console.log('🔍 ShiftContext - Agent ID:', agentId, 'Full agent:', agent);
    return agentId;
  };

  // Fetch today's shift on mount and when agent changes
  useEffect(() => {
    const currentAgentId = getAgentId();
    const previousAgentId = previousAgentIdRef.current;

    // Only fetch if agent ID has actually changed (not on every render)
    if (currentAgentId && currentAgentId !== previousAgentId) {
      previousAgentIdRef.current = currentAgentId;
      console.log('✅ ShiftContext - Fetching shift for agent:', currentAgentId);
      fetchTodayShift();
    } else if (previousAgentId === null && currentAgentId) {
      // First time setting the agent ID
      previousAgentIdRef.current = currentAgentId;
      console.log('✅ ShiftContext - Fetching shift for agent:', currentAgentId);
      fetchTodayShift();
    } else if (!currentAgentId) {
      console.log('⚠️ ShiftContext - No agent ID found');
    }
  }, [agent?._id, agent?.id]); // Still need to watch for changes in agent object

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
    const agentId = getAgentId();
    if (!agentId) {
      console.error('❌ Cannot fetch shift - no agent ID');
      return;
    }

    try {
      setLoading(true);
      console.log(`📡 Fetching shift from: ${baseUrl}/shifts/today/${agentId}`);
      const response = await fetch(`${baseUrl}/shifts/today/${agentId}`, {
        credentials: 'include'
      });

      console.log('📥 Shift response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Shift data received:', data);

        if (data.success && data.shift) {
          setShiftData(data.shift);
          setShiftStatus(data.shift.status);
          console.log('✅ Shift loaded:', data.shift.status);
        } else {
          setShiftData(null);
          setShiftStatus('not_started');
          console.log('ℹ️ No active shift found');
        }
      } else {
        console.error('❌ Shift fetch failed:', response.statusText);
      }
    } catch (err) {
      console.error('❌ Error fetching shift:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async () => {
    const agentId = getAgentId();
    if (!agentId) {
      const error = 'Cannot clock in - no agent ID found';
      console.error('❌', error);
      return { success: false, error };
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🕐 Clocking in agent:', agentId);

      const response = await fetch(`${baseUrl}/shifts/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId })
      });

      const data = await response.json();
      console.log('📥 Clock-in response:', data);

      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('active');
        console.log('✅ Clocked in successfully');
        return { success: true, shift: data.shift };
      } else {
        const error = data.error || 'Failed to clock in';
        console.error('❌ Clock-in failed:', error);
        setError(error);
        return { success: false, error };
      }
    } catch (err) {
      console.error('❌ Error clocking in:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const clockOut = async () => {
    const agentId = getAgentId();
    if (!agentId) {
      const error = 'Cannot clock out - no agent ID found';
      console.error('❌', error);
      return { success: false, error };
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🕐 Clocking out agent:', agentId);

      const response = await fetch(`${baseUrl}/shifts/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId })
      });

      const data = await response.json();
      console.log('📥 Clock-out response:', data);

      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('ended');
        setShiftTimer(0);
        console.log('✅ Clocked out successfully');
        return { success: true, shift: data.shift };
      } else {
        const error = data.error || 'Failed to clock out';
        console.error('❌ Clock-out failed:', error);
        setError(error);
        return { success: false, error };
      }
    } catch (err) {
      console.error('❌ Error clocking out:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const startBreak = async (breakType = 'short') => {
    const agentId = getAgentId();
    if (!agentId) {
      const error = 'Cannot start break - no agent ID found';
      console.error('❌', error);
      return { success: false, error };
    }

    try {
      setLoading(true);
      setError(null);
      console.log('☕ Starting break for agent:', agentId, 'Type:', breakType);

      const response = await fetch(`${baseUrl}/shifts/start-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId, breakType })
      });

      const data = await response.json();
      console.log('📥 Start break response:', data);

      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('on_break');
        console.log('✅ Break started successfully');
        return { success: true, shift: data.shift };
      } else {
        const error = data.error || 'Failed to start break';
        console.error('❌ Start break failed:', error);
        setError(error);
        return { success: false, error };
      }
    } catch (err) {
      console.error('❌ Error starting break:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const endBreak = async () => {
    const agentId = getAgentId();
    if (!agentId) {
      const error = 'Cannot end break - no agent ID found';
      console.error('❌', error);
      return { success: false, error };
    }

    try {
      setLoading(true);
      setError(null);
      console.log('☕ Ending break for agent:', agentId);

      const response = await fetch(`${baseUrl}/shifts/end-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId })
      });

      const data = await response.json();
      console.log('📥 End break response:', data);

      if (response.ok && data.success) {
        setShiftData(data.shift);
        setShiftStatus('active');
        setBreakTimer(0);
        console.log('✅ Break ended successfully');
        return { success: true, shift: data.shift };
      } else {
        const error = data.error || 'Failed to end break';
        console.error('❌ End break failed:', error);
        setError(error);
        return { success: false, error };
      }
    } catch (err) {
      console.error('❌ Error ending break:', err);
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
