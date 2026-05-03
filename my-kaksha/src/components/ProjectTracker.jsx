import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  createProject,
  fetchProjects,
  patchProjectStatus,
  removeProject,
  replaceProject,
} from "../api/projects";
import { useAuth } from "../auth/useAuth";
import AppSidebar from "./AppSidebar";
import useSidebarState from "./useSidebarState";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { font-family:'Poppins',sans-serif; background:#FAF8F3; color:#5a4a3a; overflow-x:hidden; }

  .pt-shell {
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 280px 1fr;
    background: #FAF8F3;
  }
  .pt-shell.collapsed { grid-template-columns: 94px 1fr; }
  .pt-main { min-width: 0; height: 100vh; overflow-y: auto; }

  .pt-page {
    min-height: 100vh; padding: 32px 48px 80px;
    background: #FAF8F3; font-family: 'Poppins', sans-serif;
    position: relative; overflow-x: hidden;
  }

  .pt-blob { position: fixed; border-radius: 50%; filter: blur(70px); opacity: 0.45; pointer-events: none; z-index: 0; }
  .pt-b1 { width: 450px; height: 450px; background: radial-gradient(circle,#EED6C4,#F5EFE6); top: -100px; right: -80px; animation: ptfb 9s ease-in-out infinite; }
  .pt-b2 { width: 280px; height: 280px; background: radial-gradient(circle,#C8B6A6,#EED6C4); bottom: 80px; left: -60px; animation: ptfb 11s ease-in-out infinite reverse; }
  @keyframes ptfb { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(16px,-16px) scale(1.04)} }

  .pt-header {
    position: relative; z-index: 1; margin-bottom: 48px; max-width: 1100px; margin-left: auto; margin-right: auto;
  }
  .pt-tag {
    display: inline-flex; align-items: center; gap: 8px;
    background: #F5EFE6; border: 1px solid #EED6C4;
    padding: 7px 18px; border-radius: 50px; font-size: 0.78rem; color: #8B6F5E;
    font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;
  }
  .pt-dot { width: 7px; height: 7px; background: #C8B6A6; border-radius: 50%; animation: ptpu 2s infinite; }
  @keyframes ptpu { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .pt-title { font-size: 3rem; font-weight: 800; color: #4a3728; letter-spacing: -1.2px; line-height: 1.1; margin-bottom: 10px; }
  .pt-title span { color: #8B6F5E; position: relative; display: inline-block; }
  .pt-title span::after { content:''; position:absolute; bottom:4px; left:0; right:0; height:3px; background:#EED6C4; border-radius:2px; }
  .pt-subtitle { font-size: 1rem; color: #8B6F5E; line-height: 1.7; max-width: 520px; }

  .pt-banner {
    max-width: 1100px; margin: 0 auto 24px; padding: 14px 18px;
    border-radius: 18px; border: 1px solid #f7c7bc; background: #ffeae5;
    color: #a14a3d; position: relative; z-index: 1;
  }

  .pt-stats {
    display: flex; gap: 0; align-items: center; justify-content: flex-start; flex-wrap: wrap;
    background: #F5EFE6; border: 1px solid #EED6C440;
    border-radius: 20px; padding: 20px 32px;
    margin-bottom: 40px; max-width: 1100px; margin-left: auto; margin-right: auto;
    position: relative; z-index: 1;
  }
  .pt-stat { text-align: center; padding: 0 28px; }
  .pt-stat:first-child { padding-left: 0; }
  .pt-stat-n { font-size: 1.6rem; font-weight: 800; color: #4a3728; }
  .pt-stat-l { font-size: 0.72rem; color: #C8B6A6; font-weight: 500; }
  .pt-sdiv { width: 1px; height: 36px; background: #EED6C4; }

  .pt-section { max-width: 1100px; margin: 0 auto 48px; position: relative; z-index: 1; }
  .pt-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 14px; }
  .pt-section-title { font-size: 1.3rem; font-weight: 800; color: #4a3728; display: flex; align-items: center; gap: 10px; }
  .pt-toggle-btn {
    display: flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg,#C8B6A6,#8B6F5E); color: #fff;
    border: none; padding: 10px 22px; border-radius: 50px; font-family: 'Poppins', sans-serif;
    font-weight: 600; font-size: 0.83rem; cursor: pointer;
    box-shadow: 0 6px 20px #C8B6A640; transition: all 0.3s cubic-bezier(.34,1.56,.64,1);
  }
  .pt-toggle-btn:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 12px 30px #C8B6A660; }

  .pt-form-wrap {
    background: #FFFDF9; border-radius: 28px; padding: 36px;
    border: 1px solid #EED6C440; box-shadow: 0 8px 40px #C8B6A615;
    overflow: hidden; transition: all 0.4s cubic-bezier(.34,1.56,.64,1);
    transform-origin: top;
  }
  .pt-form-wrap.hidden { display: none; }
  .pt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .pt-form-full { grid-column: 1 / -1; }
  .pt-field { display: flex; flex-direction: column; gap: 7px; }
  .pt-label {
    font-size: 0.75rem; font-weight: 700; color: #8B6F5E;
    text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;
  }
  .pt-input, .pt-textarea, .pt-select {
    background: #F5EFE6; border: 1.5px solid #EED6C450;
    border-radius: 14px; padding: 12px 16px; font-family: 'Poppins', sans-serif;
    font-size: 0.88rem; color: #4a3728; outline: none;
    transition: all 0.25s; resize: none;
  }
  .pt-input:focus, .pt-textarea:focus, .pt-select:focus {
    border-color: #C8B6A6; background: #FFFDF9;
    box-shadow: 0 0 0 3px #EED6C440;
  }
  .pt-input::placeholder, .pt-textarea::placeholder { color: #C8B6A6; }
  .pt-textarea { min-height: 90px; }
  .pt-select { appearance: none; cursor: pointer; }
  .pt-select option { background: #FAF8F3; }

  .pt-form-actions { display: flex; gap: 12px; margin-top: 8px; }
  .pt-submit-btn {
    background: linear-gradient(135deg,#C8B6A6,#8B6F5E); color: #fff;
    border: none; padding: 12px 32px; border-radius: 50px; font-family: 'Poppins', sans-serif;
    font-weight: 700; font-size: 0.9rem; cursor: pointer;
    box-shadow: 0 6px 24px #C8B6A640; transition: all 0.3s cubic-bezier(.34,1.56,.64,1);
  }
  .pt-submit-btn:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 12px 30px #C8B6A660; }
  .pt-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }
  .pt-cancel-btn {
    background: #F5EFE6; color: #8B6F5E; border: 1.5px solid #EED6C4;
    padding: 12px 24px; border-radius: 50px; font-family: 'Poppins', sans-serif;
    font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.25s;
  }
  .pt-cancel-btn:hover { background: #EED6C4; transform: translateY(-2px); }

  .pt-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
  .pt-card {
    background: #FFFDF9; border-radius: 28px; padding: 28px;
    border: 1px solid #EED6C430; box-shadow: 0 4px 20px #C8B6A610;
    transition: all 0.35s cubic-bezier(.34,1.56,.64,1); position: relative; overflow: hidden;
    display: flex; flex-direction: column; gap: 14px;
  }
  .pt-card:hover { transform: translateY(-8px); box-shadow: 0 20px 50px #C8B6A625; }
  .pt-card-deco1 { position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; border-radius: 50%; background: #EED6C450; pointer-events: none; }
  .pt-card-deco2 { position: absolute; bottom: -15px; left: -15px; width: 40px; height: 40px; border-radius: 50%; background: #C8B6A620; pointer-events: none; }
  .pt-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
  .pt-card-title { font-size: 1.05rem; font-weight: 800; color: #4a3728; line-height: 1.3; }
  .pt-card-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .pt-icon-btn {
    width: 30px; height: 30px; border-radius: 10px; border: 1.5px solid #EED6C4;
    background: #F5EFE6; display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 0.8rem; transition: all 0.2s; color: #8B6F5E;
  }
  .pt-icon-btn:hover { background: #EED6C4; transform: scale(1.1); }
  .pt-icon-btn.del:hover { background: #FFEEEE; border-color: #FFBBAA; color: #cc6655; }

  .pt-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; border-radius: 50px; font-size: 0.68rem; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .pt-badge.inprogress { background: #FFF3E0; color: #D4854A; border: 1px solid #FFD9A0; }
  .pt-badge.completed { background: #E8F5E9; color: #5A8A6A; border: 1px solid #B8E0C8; }
  .pt-status-btn { border: none; cursor: pointer; }
  .pt-card-desc { font-size: 0.84rem; color: #8B6F5E; line-height: 1.65; }

  .pt-card-dates { display: flex; gap: 10px; flex-wrap: wrap; }
  .pt-date-chip {
    background: #F5EFE6; border: 1px solid #EED6C440; border-radius: 10px;
    padding: 5px 12px; font-size: 0.7rem; color: #8B6F5E; font-weight: 500;
    display: flex; align-items: center; gap: 5px;
  }

  .pt-techs { display: flex; flex-wrap: wrap; gap: 6px; }
  .pt-tech-tag {
    background: linear-gradient(135deg,#F5EFE6,#EED6C440); border: 1px solid #EED6C4;
    color: #8B6F5E; border-radius: 8px; padding: 4px 10px;
    font-size: 0.7rem; font-weight: 600;
  }

  .pt-card-link a {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; color: #8B6F5E; font-weight: 600; text-decoration: none;
    background: #F5EFE6; border: 1px solid #EED6C4; border-radius: 50px;
    padding: 5px 14px; transition: all 0.2s;
  }
  .pt-card-link a:hover { background: #EED6C4; transform: translateX(2px); }

  .pt-empty {
    grid-column: 1 / -1; text-align: center;
    background: #FFFDF9; border-radius: 28px; padding: 64px 32px;
    border: 2px dashed #EED6C4;
  }
  .pt-empty-icon { font-size: 3.5rem; display: block; margin-bottom: 16px; }
  .pt-empty-title { font-size: 1.1rem; font-weight: 700; color: #4a3728; margin-bottom: 8px; }
  .pt-empty-desc { font-size: 0.88rem; color: #C8B6A6; }

  @media (max-width: 900px) {
    .pt-shell, .pt-shell.collapsed { grid-template-columns: 1fr; }
    .pt-page { padding: 80px 24px 60px; }
    .pt-title { font-size: 2.2rem; }
    .pt-grid { grid-template-columns: 1fr 1fr; }
    .pt-form-grid { grid-template-columns: 1fr; }
    .pt-form-full { grid-column: 1; }
  }
  @media (max-width: 600px) {
    .pt-grid { grid-template-columns: 1fr; }
    .pt-stats { flex-direction: column; gap: 16px; }
    .pt-sdiv { width: 60px; height: 1px; }
  }
`;

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  technologies: "",
  status: "In Progress",
  link: "",
};

function toTechnologyString(project) {
  return Array.isArray(project.technologies) ? project.technologies.join(", ") : String(project.technologies || "");
}

function formatTechnologies(project) {
  return (Array.isArray(project.technologies) ? project.technologies : String(project.technologies || "").split(","))
    .map((tech) => tech.trim())
    .filter(Boolean);
}

export default function ProjectTracker() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useSidebarState();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const stats = {
    total: projects.length,
    completed: projects.filter((project) => project.status === "Completed").length,
    inProgress: projects.filter((project) => project.status === "In Progress").length,
  };
  const navItems = ["Dashboard", "Analytics", "Projects", "Study Group"];

  useEffect(() => {
    let mounted = true;

    async function loadProjectsList() {
      try {
        const projectList = await fetchProjects();
        if (!mounted) return;
        setProjects(projectList);
        setRequestError("");
      } catch (error) {
        if (!mounted) return;
        setRequestError(error.message || "Unable to load projects");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProjectsList();
    return () => {
      mounted = false;
    };
  }, []);

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = true;
    if (!form.description.trim()) nextErrors.description = true;
    if (!form.startDate) nextErrors.startDate = true;
    if (!form.technologies.trim()) nextErrors.technologies = true;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setRequestError("");

    try {
      if (editId !== null) {
        const updated = await replaceProject(String(editId), form);
        setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
        setEditId(null);
      } else {
        const created = await createProject(form);
        setProjects((prev) => [...prev, created]);
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      setErrors({});
    } catch (error) {
      setRequestError(error.message || "Unable to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (project) => {
    setForm({
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      technologies: toTechnologyString(project),
      status: project.status,
      link: project.link,
    });
    setEditId(project.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (projectId) => {
    try {
      await removeProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setRequestError("");
    } catch (error) {
      setRequestError(error.message || "Unable to delete project");
    }
  };

  const handleStatusToggle = async (project) => {
    const nextStatus = project.status === "Completed" ? "In Progress" : "Completed";

    try {
      const updated = await patchProjectStatus(project.id, nextStatus);
      setProjects((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setRequestError("");
    } catch (error) {
      setRequestError(error.message || "Unable to update project status");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setErrors({});
  };

  const formatDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[Number(month) - 1]} ${day}, ${year}`;
  };

  return (
    <>
      <style>{css}</style>
      <div className={`pt-shell ${collapsed ? "collapsed" : ""}`}>
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          navItems={navItems}
          activeItem="Projects"
          onNavigate={(item) => {
            if (item === "Projects") return;
            if (item === "Dashboard") {
              navigate("/dashboard");
              return;
            }
            if (item === "Analytics") {
              navigate("/analytics");
              return;
            }
            if (item === "Study Group") {
              navigate("/study-group");
            }
          }}
          primaryAction={{ label: "Back to Home", onClick: () => navigate("/") }}
          secondaryAction={{
            label: "Sign Out",
            onClick: async () => {
              await signOut();
              navigate("/login", { replace: true });
            },
          }}
          noteTitle={`Signed in as ${user?.name || "Student"}`}
          noteText="Track milestones, update project status, and keep your portfolio organized."
          navAriaLabel="Projects navigation"
        />
        <main className="pt-main">
          <div className="pt-blob pt-b1" />
          <div className="pt-blob pt-b2" />
          <div className="pt-page">
            {requestError ? <div className="pt-banner">{requestError}</div> : null}

        <div className="pt-header">
          <FadeIn>
            <div className="pt-tag"><div className="pt-dot" /> Project Tracker</div>
            <h1 className="pt-title">Track your <span>Projects</span></h1>
            <p className="pt-subtitle">
              This board now saves through the backend so your project CRUD flow covers GET, POST, PUT, PATCH, and DELETE.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={80}>
          <div className="pt-stats">
            <div className="pt-stat">
              <div className="pt-stat-n">{stats.total}</div>
              <div className="pt-stat-l">Total Projects</div>
            </div>
            <div className="pt-sdiv" />
            <div className="pt-stat">
              <div className="pt-stat-n" style={{ color: "#5A8A6A" }}>{stats.completed}</div>
              <div className="pt-stat-l">Completed</div>
            </div>
            <div className="pt-sdiv" />
            <div className="pt-stat">
              <div className="pt-stat-n" style={{ color: "#D4854A" }}>{stats.inProgress}</div>
              <div className="pt-stat-l">In Progress</div>
            </div>
          </div>
        </FadeIn>

        <div className="pt-section">
          <FadeIn delay={100}>
            <div className="pt-section-header">
              <div className="pt-section-title">
                {showForm ? (editId ? "Edit Project" : "Add New Project") : "Your Projects"}
              </div>
              {!showForm ? (
                <button className="pt-toggle-btn" onClick={() => setShowForm(true)}>
                  + Add Project
                </button>
              ) : null}
            </div>

            <div className={`pt-form-wrap ${showForm ? "" : "hidden"}`}>
              <div className="pt-form-grid">
                <div className={`pt-field ${errors.title ? "error" : ""}`}>
                  <label className="pt-label">Project Title *</label>
                  <input
                    className="pt-input"
                    placeholder="e.g. My Kaksha Dashboard"
                    value={form.title}
                    style={errors.title ? { borderColor: "#FFBBAA" } : {}}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>

                <div className="pt-field">
                  <label className="pt-label">Status</label>
                  <select
                    className="pt-select"
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>

                <div className="pt-field pt-form-full">
                  <label className="pt-label">Description *</label>
                  <textarea
                    className="pt-textarea"
                    placeholder="Briefly describe what this project is about..."
                    value={form.description}
                    style={errors.description ? { borderColor: "#FFBBAA" } : {}}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </div>

                <div className="pt-field">
                  <label className="pt-label">Start Date *</label>
                  <input
                    type="date"
                    className="pt-input"
                    value={form.startDate}
                    style={errors.startDate ? { borderColor: "#FFBBAA" } : {}}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </div>

                <div className="pt-field">
                  <label className="pt-label">
                    End Date <span style={{ color: "#C8B6A6", fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    className="pt-input"
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  />
                </div>

                <div className="pt-field pt-form-full">
                  <label className="pt-label">Technologies Used *</label>
                  <input
                    className="pt-input"
                    placeholder="e.g. React, Node.js, MongoDB"
                    value={form.technologies}
                    style={errors.technologies ? { borderColor: "#FFBBAA" } : {}}
                    onChange={(event) => setForm((current) => ({ ...current, technologies: event.target.value }))}
                  />
                </div>

                <div className="pt-field pt-form-full">
                  <label className="pt-label">
                    Project Link <span style={{ color: "#C8B6A6", fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>(optional)</span>
                  </label>
                  <input
                    className="pt-input"
                    placeholder="https://github.com/yourproject"
                    value={form.link}
                    onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-form-actions">
                <button className="pt-submit-btn" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Saving..." : editId ? "Save Changes" : "Add Project"}
                </button>
                <button className="pt-cancel-btn" onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          </FadeIn>
        </div>

        {!showForm ? (
          <div className="pt-section">
            <div className="pt-grid">
              {loading ? (
                <div className="pt-empty">
                  <span className="pt-empty-icon">...</span>
                  <div className="pt-empty-title">Loading your projects...</div>
                  <div className="pt-empty-desc">Fetching the latest saved work from the backend.</div>
                </div>
              ) : projects.length === 0 ? (
                <div className="pt-empty">
                  <span className="pt-empty-icon">[]</span>
                  <div className="pt-empty-title">No projects yet!</div>
                  <div className="pt-empty-desc">Click "Add Project" to showcase your work.</div>
                </div>
              ) : (
                projects.map((project, index) => (
                  <FadeIn key={project.id} delay={index * 80}>
                    <div className="pt-card">
                      <div className="pt-card-deco1" />
                      <div className="pt-card-deco2" />

                      <div className="pt-card-top">
                        <div className="pt-card-title">{project.title}</div>
                        <div className="pt-card-actions">
                          <button className="pt-icon-btn" title="Edit" onClick={() => handleEdit(project)}>E</button>
                          <button className="pt-icon-btn del" title="Delete" onClick={() => handleDelete(project.id)}>X</button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`pt-badge pt-status-btn ${project.status === "Completed" ? "completed" : "inprogress"}`}
                        onClick={() => handleStatusToggle(project)}
                      >
                        {project.status}
                      </button>

                      <p className="pt-card-desc">{project.description}</p>

                      <div className="pt-card-dates">
                        <div className="pt-date-chip">Start: {formatDate(project.startDate)}</div>
                        {project.endDate ? <div className="pt-date-chip">End: {formatDate(project.endDate)}</div> : null}
                      </div>

                      <div className="pt-techs">
                        {formatTechnologies(project).map((technology) => (
                          <span key={`${project.id}-${technology}`} className="pt-tech-tag">{technology}</span>
                        ))}
                      </div>

                      {project.link ? (
                        <div className="pt-card-link">
                          <a href={project.link} target="_blank" rel="noopener noreferrer">
                            View Project
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </FadeIn>
                ))
              )}
            </div>
          </div>
        ) : null}
          </div>
        </main>
      </div>
    </>
  );
}
