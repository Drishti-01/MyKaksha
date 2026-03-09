import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./components/landing";
import Dashboard from "./Dashboard";

function DashboardPage() {
  const navigate = useNavigate();

  return <Dashboard onBackToLanding={() => navigate("/")} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
export default App;
