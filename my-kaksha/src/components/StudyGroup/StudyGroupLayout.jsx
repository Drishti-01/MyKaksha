import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import AppSidebar from "../AppSidebar";
import useSidebarState from "../useSidebarState";
import "./study-group.css";

const navItems = ["Dashboard", "Analytics", "Projects", "Study Group"];

/**
 * Shell for /study-group/* — sidebar + outlet (RoomLobby or RoomView).
 * Keeps My Kaksha navigation consistent with Dashboard / Analytics.
 */
export default function StudyGroupLayout() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useSidebarState();

  function handleNav(item) {
    if (item === "Study Group") {
      navigate("/study-group");
      return;
    }
    if (item === "Dashboard") {
      navigate("/dashboard");
      return;
    }
    if (item === "Analytics") {
      navigate("/analytics");
      return;
    }
    if (item === "Projects") {
      navigate("/projects");
    }
  }

  return (
    <div className={`sg2-shell ${collapsed ? "collapsed" : ""}`}>
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        navItems={navItems}
        activeItem="Study Group"
        onNavigate={handleNav}
        primaryAction={{ label: "Back to Home", onClick: () => navigate("/") }}
        secondaryAction={{
          label: "Sign Out",
          onClick: async () => {
            await signOut();
            navigate("/login", { replace: true });
          },
        }}
        noteTitle={`Signed in as ${user?.name || "Student"}`}
        noteText="Pick a room, sync focus, and keep chat kind."
        navAriaLabel="Study group navigation"
      />
      <main className="sg2-main">
        <Outlet />
      </main>
    </div>
  );
}
