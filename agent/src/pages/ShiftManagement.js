import React, { useState, useEffect } from 'react';
import { 
  Clock, Coffee, LogIn, LogOut, Pause, Play, 
  Calendar, TrendingUp, AlertCircle, CheckCircle,
  Timer, BarChart3, FileText
} from 'lucide-react';
import { baseUrl } from '../baseUrl';
import useStore from '../store/store';

const ShiftManagement = () => {
  const agent = useStore(state => state.agent);
  const [shiftStatus, setShiftStatus] = useState('not_started'); // not_started, active, on_break, ended
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [breaks, setBreaks] = useState([]);
  const [shiftData, setShiftData] = useState({
    totalWorkTime: 0,
    totalBreakTime: 0,
    callsHandled: 0,
    ticketsResolved: 0
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load shift data from backend
  useEffect(() => {
    fetchTodayShift();
  }, []);

  const fetchTodayShift = async () => {
    try {
      const response = await fetch(`${baseUrl}/shifts/today/${agent._id || agent.id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.shift) {
          setShiftStartTime(new Date(data.shift.startTime));
          setShiftStatus(data.shift.status);
          setBreaks(data.shift.breaks || []);
          setShiftData({
            totalWorkTime: data.shift.totalWorkTime || 0,
            totalBreakTime: data.shift.totalBreakTime || 0,
            callsHandled: data.shift.callsHandled || 0,
            ticketsResolved: data.shift.ticketsResolved || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching shift data:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      const response = await fetch(`${baseUrl}/shifts/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: agent._id || agent.id })
      });
      if (response.ok) {
        const data = await response.json();
        setShiftStartTime(new Date(data.shift.startTime));
        setShiftStatus('active');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await fetch(`${baseUrl}/shifts/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: agent._id || agent.id })
      });
      if (response.ok) {
        setShiftStatus('ended');
        fetchTodayShift(); // Refresh data
      }
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const handleStartBreak = async (breakType) => {
    try {
      const response = await fetch(`${baseUrl}/shifts/start-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          agentId: agent._id || agent.id,
          breakType 
        })
      });
      if (response.ok) {
        setBreakStartTime(new Date());
        setShiftStatus('on_break');
      }
    } catch (error) {
      console.error('Error starting break:', error);
    }
  };

  const handleEndBreak = async () => {
    try {
      const response = await fetch(`${baseUrl}/shifts/end-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: agent._id || agent.id })
      });
      if (response.ok) {
        const data = await response.json();
        setBreaks(data.breaks || []);
        setBreakStartTime(null);
        setShiftStatus('active');
      }
    } catch (error) {
      console.error('Error ending break:', error);
    }
  };

  const calculateDuration = (start, end = new Date()) => {
    if (!start) return 0;
    const diff = end - new Date(start);
    return Math.floor(diff / 1000);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const currentShiftDuration = calculateDuration(shiftStartTime);
  const currentBreakDuration = calculateDuration(breakStartTime);
  const totalBreakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0) + (breakStartTime ? currentBreakDuration : 0);
  const activeWorkTime = currentShiftDuration - totalBreakTime;

  const StatusCard = ({ icon: Icon, title, value, subtitle, color, action, actionLabel, disabled }) => (
    <div className={`bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-${color}-500/20 hover:border-${color}-500/40 transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        {action && (
          <button
            onClick={action}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              disabled 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : `bg-${color}-500 hover:bg-${color}-600 text-black`
            }`}
          >
            {actionLabel}
          </button>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-semibold mb-2">{title}</h3>
      <p className="text-4xl font-black text-white mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Shift Management</h1>
        <p className="text-gray-400">Track your work hours, breaks, and shift performance</p>
      </div>

      {/* Shift Status Banner */}
      <div className={`rounded-2xl p-6 mb-8 border-2 ${
        shiftStatus === 'active' ? 'bg-green-500/10 border-green-500/50' :
        shiftStatus === 'on_break' ? 'bg-yellow-500/10 border-yellow-500/50' :
        shiftStatus === 'ended' ? 'bg-gray-500/10 border-gray-500/50' :
        'bg-blue-500/10 border-blue-500/50'
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
              <h2 className="text-2xl font-bold text-white">
                {shiftStatus === 'active' && 'Shift Active'}
                {shiftStatus === 'on_break' && 'On Break'}
                {shiftStatus === 'ended' && 'Shift Ended'}
                {shiftStatus === 'not_started' && 'Ready to Start'}
              </h2>
              <p className="text-gray-400">
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
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition-all transform hover:scale-105"
              >
                <LogIn className="w-5 h-5" />
                <span>Clock In</span>
              </button>
            )}
            
            {shiftStatus === 'active' && (
              <>
                <button
                  onClick={() => handleStartBreak('short')}
                  className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all"
                >
                  <Coffee className="w-5 h-5" />
                  <span>Short Break</span>
                </button>
                <button
                  onClick={() => handleStartBreak('lunch')}
                  className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all"
                >
                  <Coffee className="w-5 h-5" />
                  <span>Lunch Break</span>
                </button>
                <button
                  onClick={handleClockOut}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Clock Out</span>
                </button>
              </>
            )}

            {shiftStatus === 'on_break' && (
              <button
                onClick={handleEndBreak}
                className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition-all transform hover:scale-105"
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

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-yellow-400" />
            Today's Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-gray-300 font-semibold">Calls Handled</span>
              </div>
              <span className="text-2xl font-black text-white">{shiftData.callsHandled}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-gray-300 font-semibold">Tickets Resolved</span>
              </div>
              <span className="text-2xl font-black text-white">{shiftData.ticketsResolved}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-gray-300 font-semibold">Avg Call Duration</span>
              </div>
              <span className="text-2xl font-black text-white">4:32</span>
            </div>
          </div>
        </div>

        {/* Break History */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Coffee className="w-5 h-5 mr-2 text-yellow-400" />
            Break History
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {breaks.length === 0 && !breakStartTime ? (
              <div className="text-center py-8">
                <Coffee className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No breaks taken yet</p>
              </div>
            ) : (
              <>
                {breakStartTime && (
                  <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Pause className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-white font-semibold">Current Break</p>
                        <p className="text-gray-400 text-sm">{formatTime(breakStartTime)}</p>
                      </div>
                    </div>
                    <span className="text-yellow-400 font-mono font-bold">
                      {formatDuration(currentBreakDuration)}
                    </span>
                  </div>
                )}
                {breaks.map((breakItem, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Coffee className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-semibold capitalize">{breakItem.type} Break</p>
                        <p className="text-gray-400 text-sm">
                          {formatTime(breakItem.startTime)} - {formatTime(breakItem.endTime)}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-300 font-mono">
                      {formatDuration(breakItem.duration)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Shift Guidelines */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-yellow-500/20">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
          Shift Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h4 className="text-blue-400 font-semibold mb-2">Short Breaks</h4>
            <p className="text-gray-300 text-sm">Maximum 15 minutes, up to 2 per shift</p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <h4 className="text-green-400 font-semibold mb-2">Lunch Break</h4>
            <p className="text-gray-300 text-sm">30-60 minutes, mandatory for 8+ hour shifts</p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <h4 className="text-purple-400 font-semibold mb-2">Clock Out</h4>
            <p className="text-gray-300 text-sm">Remember to clock out at the end of your shift</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagement;
