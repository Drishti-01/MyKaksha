import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./components/landing";
import Dashboard from "./Dashboard";
import StudyGroupPage from "./StudyGroup";
import ProjectTracker from "./components/ProjectTracker";
import Analytics from "./Analytics";
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";
import ProtectedRoute from "./auth/ProtectedRoute";

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Dashboard
      onBackToLanding={() => navigate("/")}
      onGoToAnalytics={() => navigate("/analytics")}
      onGoToStudyGroup={() => navigate("/study-group")}
      onGoToProjects={() => navigate("/projects")}
    />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-group"
        element={
          <ProtectedRoute>
            <StudyGroupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectTracker />
          </ProtectedRoute>
        }
      />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
export default App;
