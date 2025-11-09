import { Routes, Route, Outlet } from "react-router-dom";
import TopNav from "./components/TopNav";
import LiveCalls from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import Sidebar from "./components/SideBar";
import Agents from "./pages/Agents";
import Report from "./pages/Report";
import CallHistory from "./pages/CallHistory";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { UseSocket } from "./context/SocketContext";
import IVRMenus from "./pages/IVRMenus";
import IVRMenuForm from "./pages/IVRMenuForm";
import SystemRecordingUpload from "./components/SystemRecordingUpload";
import MiscApplicationForm from "./pages/MiscApplicationForm";
import SystemRecordingsList from "./pages/SystemRecordingsList";
import MiscApplicationList from "./components/MiscApplication/MiscApplicationList"; // This is the list component
import AnnouncementsList from "./pages/AnnouncementsList";
import AnnouncementForm from "./pages/AnnouncementForm";

import QueuePage from "./pages/QueuePage";
import AgentPage from "./pages/AgentPage";
import QueueList from "./pages/QueueList";
import AgentList from "./pages/AgentList";
import LoginPage from "./auth/Login";
import { useAuth } from "./context/AuthContext";
import QueueStatistics from "./pages/QueueStatistics";
import AgentShifts from "./pages/AgentShifts";

// Loading component to display while checking authentication
const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 text-lg">Loading...</p>
      </div>
    </div>
  );
};

// Define a Layout component for shared UI elements
const MainLayout = () => {
  const { socket, setSocket, clearSocketState } = UseSocket();

  useEffect(() => {
    if (!socket) {
      const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");
      newSocket.on("connect", () => setSocket(newSocket));
      return () => {
        newSocket.disconnect();
        clearSocketState();
      };
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-50">
        <TopNav />
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 h-full overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { loading } = useAuth();

  // Show loading UI while checking authentication
  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* 1. Login page - this route stands alone */}
      <Route path="/login" element={<LoginPage />} />

      {/* 2. All other routes that share the TopNav and Sidebar layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="report" element={<Report />} />
        <Route path="dashboard" element={<LiveCalls />} />
        <Route path="ivr-menus" element={<IVRMenus />} />
        <Route path="ivr-menu/create" element={<IVRMenuForm />} />
        <Route path="ivr-menu/edit/:id" element={<IVRMenuForm />} />

        <Route path="system-recordings" element={<SystemRecordingsList />} />
        <Route path="system-recordings-upload" element={<SystemRecordingUpload />} />
        
        <Route path="announcements" element={<AnnouncementsList />} />
        <Route path="announcements/create" element={<AnnouncementForm />} />
        <Route path="announcements/edit/:id" element={<AnnouncementForm />} />

        <Route path="call-history" element={<CallHistory />} />

        <Route path="new-misc-application" element={<MiscApplicationForm />} />
        <Route path="misc-applications" element={<MiscApplicationList />} />

        <Route path="agent/dev" element={<AgentPage />} />
        <Route path="agent/dev/:id" element={<AgentPage />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agents/list" element={<AgentList />} />

        <Route path="queue-list" element={<QueueList />} />
        <Route path="queues/edit/:id" element={<QueuePage />} />
        <Route path="queue/dev" element={<QueuePage />} />
        <Route path="queue-statistics" element={<QueueStatistics />} />
        
        <Route path="agent-shifts" element={<AgentShifts />} />
      </Route>
    </Routes>
  );
}