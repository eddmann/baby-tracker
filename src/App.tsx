import { Routes, Route, Navigate } from "react-router";
import { AppShell, AuthGuard } from "./components/layout/AppShell";

import PinEntry from "./pages/PinEntry";
import Dashboard from "./pages/Dashboard";
import Sleep from "./pages/Sleep";
import Feed from "./pages/Feed";
import Nappy from "./pages/Nappy";
import Pump from "./pages/Pump";
import History from "./pages/History";
import DailyTasks from "./pages/DailyTasks";
import Growth from "./pages/Growth";

function App() {
  return (
    <Routes>
      <Route path="/pin" element={<PinEntry />} />

      <Route
        path="/*"
        element={
          <AuthGuard>
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sleep" element={<Sleep />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/nappy" element={<Nappy />} />
                <Route path="/pump" element={<Pump />} />
                <Route path="/history" element={<History />} />
                <Route path="/daily-tasks" element={<DailyTasks />} />
                <Route path="/growth" element={<Growth />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default App;
