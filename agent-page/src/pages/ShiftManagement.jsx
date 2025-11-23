import React from 'react';
import { 
  Clock, Coffee, LogIn, LogOut, Pause, Play, 
  TrendingUp, AlertCircle, CheckCircle, Timer
} from 'lucide-react';
import { useShift } from '../contexts/ShiftContext';

const ShiftManagement = () => {
  const {
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
    formatTime: formatDuration,
  } = useShift();

  const formatTime = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleClockIn = async () => {
    const result = await clockIn();
    if (!result.success) {
      alert(result.error || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    const result = await clockOut();
    if (!result.success) {
      alert(result.error || 'Failed to clock out');
    }
  };

  const handleStartBreak = async (breakType) => {
    const result = await startBreak(breakType);
    if (!result.success) {
      alert(result.error || 'Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    const result = await endBreak();
    if (!result.success) {
      alert(result.error || 'Failed to end break');
    }
  };

  const currentShiftDuration = shiftData?.startTime 
    ? Math.floor((new Date() - new Date(shiftData.startTime)) / 1000)
    : 0;
  const totalBreakTime = shiftData?.totalBreakTime || 0;
  const activeWorkTime = shiftTimer;
  const breaks = shiftData?.breaks || [];
  const breakStartTime = shiftStatus === 'on_break' && breaks.length > 0 
    ? breaks[breaks.length - 1].startTime 
    : null;
  const shiftStartTime = shiftData?.startTime;
  const currentBreakDuration = breakTimer;

  const StatusCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-100' :
          color === 'green' ? 'bg-green-100' :
          color === 'yellow' ? 'bg-yellow-100' :
          'bg-purple-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' :
            color === 'yellow' ? 'text-yellow-600' :
            'text-purple-600'
          }`} />
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-semibold mb-2">{title}</h3>
      <p className="text-4xl font-black text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 transition-colors duration-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Shift Management</h1>
        <p className="text-gray-600">Track your work hours and breaks</p>
      </div>

      {/* Shift Status Banner */}
      <div className={`rounded-2xl p-6 mb-8 border-2 shadow-lg ${
        shiftStatus === 'active' ? 'bg-green-50 border-green-500/50' :
        shiftStatus === 'on_break' ? 'bg-yellow-50 border-yellow-500/50' :
        shiftStatus === 'ended' ? 'bg-gray-100 border-gray-500/50' :
        'bg-blue-50 border-blue-500/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              shiftStatus === 'active' ? 'bg-green-500' :
              shiftStatus === 'on_break' ? 'bg-yellow-500' :
              shiftStatus === 'ended' ? 'bg-gray-500' :
              'bg-blue-500'
            }`}>
              {shiftStatus === 'active' && <Play className="w-8 h-8 text-black" />}
              {shiftStatus === 'on_break' && <Coffee className="w-8 h-8 text-black" />}
              {shiftStatus === 'ended' && <CheckCircle className="w-8 h-8 text-black" />}
              {shiftStatus === 'not_started' && <Clock className="w-8 h-8 text-black" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {shiftStatus === 'active' && 'Shift Active'}
                {shiftStatus === 'on_break' && 'On Break'}
                {shiftStatus === 'ended' && 'Shift Ended'}
                {shiftStatus === 'not_started' && 'Ready to Start'}
              </h2>
              <p className="text-gray-600">
                {shiftStatus === 'not_started' && 'Clock in to start your shift'}
                {shiftStatus === 'active' && `Started at ${formatTime(shiftStartTime)}`}
                {shiftStatus === 'on_break' && `Break started at ${formatTime(breakStartTime)}`}
                {shiftStatus === 'ended' && 'Great work today!'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {shiftStatus === 'not_started' && (
              <button
                onClick={handleClockIn}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <LogIn className="w-5 h-5" />
                <span>Clock In</span>
              </button>
            )}
            
            {shiftStatus === 'active' && (
              <>
                <button
                  onClick={() => handleStartBreak('short')}
                  className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all shadow-lg"
                >
                  <Coffee className="w-5 h-5" />
                  <span>Short Break</span>
                </button>
                <button
                  onClick={() => handleStartBreak('lunch')}
                  className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all shadow-lg"
                >
                  <Coffee className="w-5 h-5" />
                  <span>Lunch Break</span>
                </button>
                <button
                  onClick={handleClockOut}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Clock Out</span>
                </button>
              </>
            )}

            {shiftStatus === 'on_break' && (
              <button
                onClick={handleEndBreak}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <Play className="w-5 h-5" />
                <span>End Break</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Tracking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          icon={Clock}
          title="Total Shift Time"
          value={formatDuration(currentShiftDuration)}
          subtitle="Including breaks"
          color="blue"
        />
        <StatusCard
          icon={Timer}
          title="Active Work Time"
          value={formatDuration(activeWorkTime)}
          subtitle="Excluding breaks"
          color="green"
        />
        <StatusCard
          icon={Coffee}
          title="Total Break Time"
          value={formatDuration(totalBreakTime)}
          subtitle={`${breaks.length} break${breaks.length !== 1 ? 's' : ''} taken`}
          color="yellow"
        />
        <StatusCard
          icon={TrendingUp}
          title="Productivity"
          value={`${Math.round((activeWorkTime / Math.max(currentShiftDuration, 1)) * 100)}%`}
          subtitle="Work time ratio"
          color="purple"
        />
      </div>

      {/* Current Break Display (if on break) */}
      {breakStartTime && (
        <div className="bg-yellow-50 border-2 border-yellow-500/50 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                <Pause className="w-8 h-8 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Current Break</h3>
                <p className="text-gray-600">Started at {formatTime(breakStartTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-mono font-black text-yellow-600">
                {formatDuration(currentBreakDuration)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Break Duration</p>
            </div>
          </div>
        </div>
      )}

      {/* Shift Guidelines */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
          Shift Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="text-blue-600 font-semibold mb-2">Short Breaks</h4>
            <p className="text-gray-700 text-sm">Maximum 15 minutes, up to 2 per shift</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <h4 className="text-green-600 font-semibold mb-2">Lunch Break</h4>
            <p className="text-gray-700 text-sm">30-60 minutes, mandatory for 8+ hour shifts</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <h4 className="text-purple-600 font-semibold mb-2">Clock Out</h4>
            <p className="text-gray-700 text-sm">Remember to clock out at the end of your shift</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
