import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./components/landing";
import Dashboard from "./Dashboard";
import StudyGroupPage from "./StudyGroup";
import ProjectTracker from "./components/ProjectTracker";
import Analytics from "./Analytics";
import SignupPage from "./SignupPage";
import LoginPage from "./LoginPage";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useAuth } from "./auth/useAuth";

function DashboardPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  return (
    <Dashboard
      currentUserName={user?.name || "Student"}
      onBackToLanding={() => navigate("/")}
      onGoToAnalytics={() => navigate("/analytics")}
      onGoToProjects={() => navigate("/projects")}
      onGoToStudyGroup={() => navigate("/study-group")}
      onLogout={async () => {
        await signOut();
        navigate("/login", { replace: true });
      }}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/study-group" element={<ProtectedRoute><StudyGroupPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectTracker /></ProtectedRoute>} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </AuthProvider>
  );
}
export default App;
