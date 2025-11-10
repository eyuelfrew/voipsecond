import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import baseUrl from '../util/baseUrl';

interface Break {
  type: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface Shift {
  _id: string;
  agentId: {
    _id: string;
    name: string;
    username: string;
    extension?: string;
  };
  startTime: string;
  endTime?: string;
  status: 'active' | 'on_break' | 'ended';
  breaks: Break[];
  totalWorkTime: number;
  totalBreakTime: number;
  callsHandled: number;
  ticketsResolved: number;
}

interface ShiftContextType {
  activeShifts: Shift[];
  todayShifts: Shift[];
  loading: boolean;
  error: string | null;
  refreshShifts: () => Promise<void>;
  clockIn: (agentId: string) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
  clockOut: (agentId: string) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
  startBreak: (agentId: string, breakType: string) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
  endBreak: (agentId: string) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
  getTodayShift: (agentId: string) => Promise<Shift | null>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshShifts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeRes, todayRes] = await Promise.all([
        axios.get(`${baseUrl}/api/shifts/active`),
        axios.get(`${baseUrl}/api/shifts/all-today`),
      ]);

      if (activeRes.data.success) {
        setActiveShifts(activeRes.data.shifts || []);
      }
      if (todayRes.data.success) {
        setTodayShifts(todayRes.data.shifts || []);
      }
    } catch (err: any) {
      console.error('Error fetching shifts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const clockIn = async (agentId: string) => {
    try {
      const response = await axios.post(`${baseUrl}/api/shifts/clock-in`, { agentId });
      if (response.data.success) {
        await refreshShifts();
        return { success: true, shift: response.data.shift };
      }
      return { success: false, error: 'Failed to clock in' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to clock in';
      return { success: false, error: errorMsg };
    }
  };

  const clockOut = async (agentId: string) => {
    try {
      const response = await axios.post(`${baseUrl}/api/shifts/clock-out`, { agentId });
      if (response.data.success) {
        await refreshShifts();
        return { success: true, shift: response.data.shift };
      }
      return { success: false, error: 'Failed to clock out' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to clock out';
      return { success: false, error: errorMsg };
    }
  };

  const startBreak = async (agentId: string, breakType: string) => {
    try {
      const response = await axios.post(`${baseUrl}/api/shifts/start-break`, { agentId, breakType });
      if (response.data.success) {
        await refreshShifts();
        return { success: true, shift: response.data.shift };
      }
      return { success: false, error: 'Failed to start break' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to start break';
      return { success: false, error: errorMsg };
    }
  };

  const endBreak = async (agentId: string) => {
    try {
      const response = await axios.post(`${baseUrl}/api/shifts/end-break`, { agentId });
      if (response.data.success) {
        await refreshShifts();
        return { success: true, shift: response.data.shift };
      }
      return { success: false, error: 'Failed to end break' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to end break';
      return { success: false, error: errorMsg };
    }
  };

  const getTodayShift = async (agentId: string): Promise<Shift | null> => {
    try {
      const response = await axios.get(`${baseUrl}/api/shifts/today/${agentId}`);
      if (response.data.success) {
        return response.data.shift;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching today shift:', err);
      return null;
    }
  };

  useEffect(() => {
    refreshShifts();
    // Refresh every 30 seconds
    const interval = setInterval(refreshShifts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ShiftContext.Provider
      value={{
        activeShifts,
        todayShifts,
        loading,
        error,
        refreshShifts,
        clockIn,
        clockOut,
        startBreak,
        endBreak,
        getTodayShift,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};
