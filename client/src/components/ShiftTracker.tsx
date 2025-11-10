import React from 'react';
import { Clock, Coffee, Users, Activity } from 'lucide-react';
import { useShift } from '../context/ShiftContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

const ShiftTracker: React.FC = () => {
  const { activeShifts, todayShifts, loading } = useShift();
  const { isDarkMode } = useTheme();

  const onBreakCount = activeShifts.filter(s => s.status === 'on_break').length;
  const completedCount = todayShifts.filter(s => s.status === 'ended').length;

  if (loading && activeShifts.length === 0) {
    return (
      <div className="cc-glass rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 cc-text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold cc-text-accent">Shift Tracking</h2>
            <p className="text-sm cc-text-secondary">Real-time agent shift status</p>
          </div>
        </div>
        <Link
          to="/agent-shifts"
          className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors text-sm font-medium"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Shifts */}
        <div className="cc-glass-hover rounded-lg p-4 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold cc-text-accent group-hover:scale-110 transition-transform">
              {activeShifts.length}
            </span>
          </div>
          <p className="text-sm cc-text-secondary">Active Now</p>
        </div>

        {/* On Break */}
        <div className="cc-glass-hover rounded-lg p-4 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Coffee className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold cc-text-accent group-hover:scale-110 transition-transform">
              {onBreakCount}
            </span>
          </div>
          <p className="text-sm cc-text-secondary">On Break</p>
        </div>

        {/* Today Total */}
        <div className="cc-glass-hover rounded-lg p-4 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold cc-text-accent group-hover:scale-110 transition-transform">
              {todayShifts.length}
            </span>
          </div>
          <p className="text-sm cc-text-secondary">Today Total</p>
        </div>

        {/* Completed */}
        <div className="cc-glass-hover rounded-lg p-4 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-2xl font-bold cc-text-accent group-hover:scale-110 transition-transform">
              {completedCount}
            </span>
          </div>
          <p className="text-sm cc-text-secondary">Completed</p>
        </div>
      </div>

      {/* Active Agents List */}
      {activeShifts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold cc-text-accent mb-3">Currently Active</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeShifts.slice(0, 5).map((shift) => (
              <div
                key={shift._id}
                className="flex items-center justify-between p-3 rounded-lg cc-glass-hover transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">
                      {shift.agentId?.name?.charAt(0) || shift.agentId?.username?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium cc-text-accent">
                      {shift.agentId?.name || shift.agentId?.username || 'Unknown'}
                    </p>
                    <p className="text-xs cc-text-secondary">
                      {shift.agentId?.extension ? `Ext: ${shift.agentId.extension}` : 'No extension'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      shift.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {shift.status === 'active' ? 'Active' : 'On Break'}
                  </span>
                  <p className="text-xs cc-text-secondary mt-1">
                    {Math.floor(shift.totalWorkTime / 3600)}h {Math.floor((shift.totalWorkTime % 3600) / 60)}m
                  </p>
                </div>
              </div>
            ))}
          </div>
          {activeShifts.length > 5 && (
            <Link
              to="/agent-shifts"
              className="block text-center text-sm cc-text-accent hover:underline mt-3"
            >
              View all {activeShifts.length} active shifts
            </Link>
          )}
        </div>
      )}

      {activeShifts.length === 0 && (
        <div className="mt-6 text-center py-8">
          <Clock className="w-12 h-12 cc-text-secondary mx-auto mb-3 opacity-50" />
          <p className="cc-text-secondary">No active shifts at the moment</p>
        </div>
      )}
    </div>
  );
};

export default ShiftTracker;
