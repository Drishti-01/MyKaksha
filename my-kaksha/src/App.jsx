import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./components/landing";
import Dashboard from "./Dashboard";
import ProjectTracker from "./components/ProjectTracker";

function DashboardPage() {
  const navigate = useNavigate();

  return <Dashboard onBackToLanding={() => navigate("/")} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/projects" element={<ProjectTracker />} />
    </Routes>
  );
}
export default App;
