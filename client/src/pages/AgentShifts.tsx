import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AccessTime,
  Coffee,
  CheckCircle,
  Person,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';

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

interface AgentSummary {
  agent: {
    _id: string;
    name: string;
    username: string;
    extension?: string;
  };
  totalShifts: number;
  totalWorkTime: number;
  totalBreakTime: number;
  totalCallsHandled: number;
  totalTicketsResolved: number;
  shifts: Shift[];
}

const AgentShifts: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [summary, setSummary] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShiftData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchShiftData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchShiftData = async () => {
    try {
      setLoading(true);
      const [activeRes, todayRes, summaryRes] = await Promise.all([
        axios.get('/api/shifts/active'),
        axios.get('/api/shifts/all-today'),
        axios.get('/api/shifts/summary'),
      ]);

      if (activeRes.data.success) {
        setActiveShifts(activeRes.data.shifts);
      }
      if (todayRes.data.success) {
        setTodayShifts(todayRes.data.shifts);
      }
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.summary);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shift data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'success' as const },
      on_break: { label: 'On Break', color: 'warning' as const },
      ended: { label: 'Ended', color: 'default' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ended;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.100`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && activeShifts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Agent Shift Management
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
        Monitor agent shifts, breaks, and productivity in real-time
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Shifts"
            value={activeShifts.length}
            icon={<Person sx={{ color: 'primary.main', fontSize: 32 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Today"
            value={todayShifts.length}
            icon={<AccessTime sx={{ color: 'info.main', fontSize: 32 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="On Break"
            value={activeShifts.filter((s) => s.status === 'on_break').length}
            icon={<Coffee sx={{ color: 'warning.main', fontSize: 32 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={todayShifts.filter((s) => s.status === 'ended').length}
            icon={<CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Active Shifts" />
          <Tab label="Today's Shifts" />
          <Tab label="Agent Summary" />
        </Tabs>
      </Paper>

      {/* Active Shifts Tab */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Extension</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Work Time</TableCell>
                <TableCell>Break Time</TableCell>
                <TableCell>Calls</TableCell>
                <TableCell>Tickets</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">No active shifts</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                activeShifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell>{shift.agentId?.name || 'Unknown'}</TableCell>
                    <TableCell>{shift.agentId?.extension || '-'}</TableCell>
                    <TableCell>{getStatusChip(shift.status)}</TableCell>
                    <TableCell>{formatDateTime(shift.startTime)}</TableCell>
                    <TableCell>{formatTime(shift.totalWorkTime)}</TableCell>
                    <TableCell>{formatTime(shift.totalBreakTime)}</TableCell>
                    <TableCell>{shift.callsHandled}</TableCell>
                    <TableCell>{shift.ticketsResolved}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Today's Shifts Tab */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Extension</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Work Time</TableCell>
                <TableCell>Breaks</TableCell>
                <TableCell>Calls</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {todayShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">No shifts today</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                todayShifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell>{shift.agentId?.name || 'Unknown'}</TableCell>
                    <TableCell>{shift.agentId?.extension || '-'}</TableCell>
                    <TableCell>{getStatusChip(shift.status)}</TableCell>
                    <TableCell>{formatDateTime(shift.startTime)}</TableCell>
                    <TableCell>
                      {shift.endTime ? formatDateTime(shift.endTime) : '-'}
                    </TableCell>
                    <TableCell>{formatTime(shift.totalWorkTime)}</TableCell>
                    <TableCell>{shift.breaks.length}</TableCell>
                    <TableCell>{shift.callsHandled}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Agent Summary Tab */}
      {activeTab === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell>Extension</TableCell>
                <TableCell>Total Shifts</TableCell>
                <TableCell>Total Work Time</TableCell>
                <TableCell>Total Break Time</TableCell>
                <TableCell>Calls Handled</TableCell>
                <TableCell>Tickets Resolved</TableCell>
                <TableCell>Productivity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">No data available</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                summary.map((item) => {
                  const totalTime = item.totalWorkTime + item.totalBreakTime;
                  const productivity =
                    totalTime > 0
                      ? Math.round((item.totalWorkTime / totalTime) * 100)
                      : 0;
                  return (
                    <TableRow key={item.agent._id}>
                      <TableCell>{item.agent.name}</TableCell>
                      <TableCell>{item.agent.extension || '-'}</TableCell>
                      <TableCell>{item.totalShifts}</TableCell>
                      <TableCell>{formatTime(item.totalWorkTime)}</TableCell>
                      <TableCell>{formatTime(item.totalBreakTime)}</TableCell>
                      <TableCell>{item.totalCallsHandled}</TableCell>
                      <TableCell>{item.totalTicketsResolved}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${productivity}%`}
                          color={productivity >= 80 ? 'success' : 'warning'}
                          size="small"
                          icon={<TrendingUp />}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AgentShifts;
