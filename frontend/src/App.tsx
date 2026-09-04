import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { LoadingState } from "@/components/States";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

// Route-level code splitting keeps the landing + auth bundle small.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Feed = lazy(() => import("@/pages/Feed"));
const Discover = lazy(() => import("@/pages/Discover"));
const Profile = lazy(() => import("@/pages/Profile"));
const Messages = lazy(() => import("@/pages/Messages"));
const MeetSomeone = lazy(() => import("@/pages/MeetSomeone"));
const CallRoom = lazy(() => import("@/pages/CallRoom"));
const Projects = lazy(() => import("@/pages/Projects"));
const Meetings = lazy(() => import("@/pages/Meetings"));
const Communities = lazy(() => import("@/pages/Communities"));
const Connections = lazy(() => import("@/pages/Connections"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Search = lazy(() => import("@/pages/Search"));
const Settings = lazy(() => import("@/pages/Settings"));
const Admin = lazy(() => import("@/pages/Admin"));

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState label="Loading…" />}>{children}</Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated */}
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/feed" element={<Protected><Feed /></Protected>} />
        <Route path="/discover" element={<Protected><Discover /></Protected>} />
        <Route path="/profile/:id" element={<Protected><Profile /></Protected>} />
        <Route path="/messages" element={<Protected><Messages /></Protected>} />
        <Route path="/meet" element={<Protected><MeetSomeone /></Protected>} />
        <Route path="/calls/:callId" element={<Protected><CallRoom /></Protected>} />
        <Route path="/projects" element={<Protected><Projects /></Protected>} />
        <Route path="/meetings" element={<Protected><Meetings /></Protected>} />
        <Route path="/communities" element={<Protected><Communities /></Protected>} />
        <Route path="/connections" element={<Protected><Connections /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/search" element={<Protected><Search /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/admin" element={<Protected><Admin /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* bottom-right keeps toasts clear of the notification bell + user menu in the top bar */}
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  );
}
