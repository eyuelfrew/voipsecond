

## 🚀 **Prompt: Build a Modern Call Center Agent Dashboard (React + Node.js)**

### 🧠 **Project Overview**

Build a **Call Center Agent Web Interface** using **React (frontend)** and **Node.js (backend)**.
The system will provide agents with a clean, modern, responsive dashboard that includes telephony controls (dialer, DTMF, transfers, hold, hangup, pause), analytics, call history, and contact management — all styled with a professional dark/light theme toggle.

The **login page** already exists — replicate its color palette and typography to keep the design consistent across the app.

---

### 🎨 **Frontend (React + Tailwind or ShadCN UI)**

**Key Requirements:**

1. **Theme Toggle:**

   * Implement a global dark/light theme toggle (persistent in `localStorage`).
   * Respect system theme preferences on initial load.
   * Use colors and typography consistent with the existing login page.

2. **Main Layout:**

   * Upon login, the agent is redirected to `/dashboard`.
   * The layout contains:

     * **Top Navbar** with:

       * Dealer/Dialer button (opens a full-featured phone modal)
       * Status dropdown (Available, Paused, Offline)
       * Profile avatar with dropdown (Settings, Logout)
       * Optional Notification bell or Quick actions
     * **Left Sidebar** with navigation links:

       * Dashboard (default landing)
       * Call History
       * Analytics
       * Contacts
       * Phone Numbers
       * Settings
     * **Main Content Area** (dynamic pages loaded here).

3. **Dialer Modal (when Dealer button is clicked):**

   * Appears centered as a modal overlay.
   * Contains a numeric keypad with DTMF support.
   * Functional buttons:

     * **Dial / Call**
     * **Hang Up**
     * **Hold / Resume**
     * **Mute / Unmute**
     * **Transfer (Blind Transfer / Transfer to Specific Number)**
   * Transfer options:

     * **Blind Transfer:** instantly sends the call to another number.
     * **Supervised Transfer:** allows user to speak before completing the transfer.
   * Dialpad should accept input manually or by clicking digits.
   * Real-time call status indicator (ringing, connected, on hold, ended).
   * Softphone integration-ready (e.g., WebRTC/SIP.js structure placeholder).

4. **Dashboard Page:**

   * Shows quick summary cards:

     * Today’s total calls
     * Missed calls
     * Average call duration
     * Active agents count
   * Graph section (line or bar chart) for call trends over time.
   * Table for current active calls (if any).
   * Real-time agent status indicator.

5. **Call History Page:**

   * Table listing previous calls:

     * Caller Name / Number
     * Call Duration
     * Status (Answered, Missed, Transferred)
     * Date/Time
   * Search and filter options (by date, status, number).
   * Pagination.

6. **Contacts Page:**

   * CRUD functionality for managing contacts (Name, Number, Tags).
   * Search bar and filters (frequent, recent, etc.).
   * Click-to-call integration with dialer modal.

7. **Phone Numbers Page:**

   * Displays assigned DID numbers, availability, and routing options.
   * Optional: “Assign Number” button (future admin function).

8. **Analytics Page:**

   * Real-time and historical analytics (charts using Recharts or Chart.js):

     * Call volume by hour/day
     * Agent performance (calls handled, average duration)
     * Call outcomes (answered, missed, transferred)
   * Filters: by agent, date, department.

9. **Settings Page (Optional):**

   * Theme toggle (also accessible from profile dropdown)
   * Audio settings (input/output device selection placeholder)
   * Call behavior preferences (auto-answer, ring timeouts, etc.)

---

### ⚙️ **Backend (Node.js + Express)**

**Requirements:**

* Authentication and session handling already implemented.
* Placeholder routes for:

  * `/api/calls` → CRUD for call history
  * `/api/contacts` → CRUD for contacts
  * `/api/analytics` → Return call stats, charts data
* Integrate Socket.IO for real-time updates (incoming calls, call status).
* Prepare structure for WebRTC/SIP.js signaling layer for the dialer modal (optional placeholder).

---

### 🧩 **Functional Details**

* All telephony buttons should have disabled states and tooltips.
* The system should use a state management solution (e.g., Redux Toolkit, Zustand, or Context API).
* Navigation should be handled using React Router v6.
* The design must be **responsive**, working seamlessly on desktops and large tablets.
* Add smooth animations using Framer Motion for modal transitions and dropdowns.

---

### 🧠 **Extra Enhancements (Optional but Recommended)**

* 🔔 **Notifications System:** Small toast for new incoming call or missed call.
* 🧍 **Agent Presence Indicator:** Display status (“Available”, “In Call”, “Paused”) in real-time.
* ⏱️ **Break Timer:** If an agent sets status to “Paused”, start a visible countdown timer.
* 📞 **Recent Calls Widget:** Small sidebar widget that shows the last few calls for quick access.
* 🧊 **Localization Support:** Prepare structure for future multi-language UI (e.g., English, Amharic).
* 📱 **PWA Ready:** Allow agent dashboard to be installed as a web app.

---

### 🖌️ **Design Guidelines**

* Clean, professional, minimal interface.
* Components styled with TailwindCSS + ShadCN UI or Material UI.
* Rounded corners, soft shadows, and subtle hover animations.
* Typography: Use Inter or Poppins font family.
* Maintain color consistency with the login page.
* Use icons from **Lucide-react** or **Heroicons**.

---

### ✅ **Deliverables**

* Responsive React dashboard with sidebar and navbar layout.
* Functional dialer modal (UI + placeholder for backend integration).
* Pages: Dashboard, Call History, Analytics, Contacts, Phone Numbers, Settings.
* Fully implemented theme toggle (light/dark).
* Real-time updates structure (via Socket.IO).
* Backend stubs for data persistence.

---

If you’d like, I can generate the **exact folder structure + component architecture** for this next (including `DialerModal.jsx`, `NavBar.jsx`, `SideBar.jsx`, `Dashboard.jsx`, etc.), so you can start coding immediately with proper scaffolding.

Would you like me to write that next — a full folder and component blueprint ready for implementation?
