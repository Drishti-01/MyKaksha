import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./components/landing";
import Dashboard from "./Dashboard";
import StudyGroupPage from "./StudyGroup";
import ProjectTracker from "./components/ProjectTracker";
import Analytics from "./Analytics";
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Dashboard
      onBackToLanding={() => navigate("/")}
      onGoToStudyGroup={() => navigate("/study-group")}
    />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/study-group" element={<StudyGroupPage />} />
      <Route path="/projects" element={<ProjectTracker />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
export default App;
