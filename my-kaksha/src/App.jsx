import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./components/landing";
import Dashboard from "./Dashboard";
import StudyGroupLayout from "./components/StudyGroup/StudyGroupLayout";
import RoomLobby from "./components/StudyGroup/RoomLobby";
import RoomView from "./components/StudyGroup/RoomView";
import ProjectTracker from "./components/ProjectTracker";
import StudyResources from "./components/StudyResources";
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
      onGoToResources={() => navigate("/resources")}
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
            <StudyGroupLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoomLobby />} />
        <Route path=":roomId" element={<RoomView />} />
      </Route>
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectTracker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <StudyResources />
          </ProtectedRoute>
        }
      />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
export default App;
