import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { font-family:'Poppins',sans-serif; background:#FAF8F3; color:#5a4a3a; overflow-x:hidden; }

  /* NAVBAR */
  .pt-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(250,248,243,0.92); backdrop-filter: blur(14px);
    padding: 14px 48px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #EED6C430; font-family: 'Poppins', sans-serif;
  }
  .pt-nav-logo { font-size: 1.3rem; font-weight: 800; color: #8B6F5E; }
  .pt-nav-logo span { color: #C8B6A6; }
  .pt-back-btn {
    display: flex; align-items: center; gap: 8px;
    background: #F5EFE6; color: #8B6F5E; border: 1.5px solid #EED6C4;
    padding: 9px 20px; border-radius: 50px; font-family: 'Poppins', sans-serif;
    font-weight: 600; font-size: 0.83rem; cursor: pointer;
    transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
  }
  .pt-back-btn:hover { background: #EED6C4; transform: translateY(-2px) scale(1.03); }

  /* PAGE WRAPPER */
  .pt-page {
    min-height: 100vh; padding: 96px 48px 80px;
    background: #FAF8F3; font-family: 'Poppins', sans-serif;
    position: relative; overflow-x: hidden;
  }

  /* BLOBS */
  .pt-blob { position: fixed; border-radius: 50%; filter: blur(70px); opacity: 0.45; pointer-events: none; z-index: 0; }
  .pt-b1 { width: 450px; height: 450px; background: radial-gradient(circle,#EED6C4,#F5EFE6); top: -100px; right: -80px; animation: ptfb 9s ease-in-out infinite; }
  .pt-b2 { width: 280px; height: 280px; background: radial-gradient(circle,#C8B6A6,#EED6C4); bottom: 80px; left: -60px; animation: ptfb 11s ease-in-out infinite reverse; }
  @keyframes ptfb { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(16px,-16px) scale(1.04)} }

  /* HEADER */
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
  .pt-subtitle { font-size: 1rem; color: #8B6F5E; line-height: 1.7; max-width: 440px; }

  /* STATS BAR */
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

  /* ADD PROJECT SECTION */
  .pt-section { max-width: 1100px; margin: 0 auto 48px; position: relative; z-index: 1; }
  .pt-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .pt-section-title { font-size: 1.3rem; font-weight: 800; color: #4a3728; display: flex; align-items: center; gap: 10px; }
  .pt-toggle-btn {
    display: flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg,#C8B6A6,#8B6F5E); color: #fff;
    border: none; padding: 10px 22px; border-radius: 50px; font-family: 'Poppins', sans-serif;
    font-weight: 600; font-size: 0.83rem; cursor: pointer;
    box-shadow: 0 6px 20px #C8B6A640; transition: all 0.3s cubic-bezier(.34,1.56,.64,1);
  }
  .pt-toggle-btn:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 12px 30px #C8B6A660; }

  /* FORM */
  .pt-form-wrap {
    background: #FFFDF9; border-radius: 28px; padding: 36px;
    border: 1px solid #EED6C440; box-shadow: 0 8px 40px #C8B6A615;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(.34,1.56,.64,1);
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
  .pt-cancel-btn {
    background: #F5EFE6; color: #8B6F5E; border: 1.5px solid #EED6C4;
    padding: 12px 24px; border-radius: 50px; font-family: 'Poppins', sans-serif;
    font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.25s;
  }
  .pt-cancel-btn:hover { background: #EED6C4; transform: translateY(-2px); }

  /* PROJECTS GRID */
  .pt-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }

  /* PROJECT CARD */
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

  .pt-card-desc { font-size: 0.84rem; color: #8B6F5E; line-height: 1.65; }

  .pt-card-dates { display: flex; gap: 10px; }
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

  /* EMPTY STATE */
  .pt-empty {
    grid-column: 1 / -1; text-align: center;
    background: #FFFDF9; border-radius: 28px; padding: 64px 32px;
    border: 2px dashed #EED6C4;
  }
  .pt-empty-icon { font-size: 3.5rem; display: block; margin-bottom: 16px; }
  .pt-empty-title { font-size: 1.1rem; font-weight: 700; color: #4a3728; margin-bottom: 8px; }
  .pt-empty-desc { font-size: 0.88rem; color: #C8B6A6; }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .pt-page { padding: 80px 24px 60px; }
    .pt-nav { padding: 14px 24px; }
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
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

const EMPTY_FORM = {
  title: "", description: "", startDate: "", endDate: "",
  technologies: "", status: "In Progress", link: ""
};

const PROJECTS_STORAGE_KEY = "mykaksha_projects";

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ProjectTracker() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(loadProjects);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === "Completed").length,
    inProgress: projects.filter(p => p.status === "In Progress").length,
  };

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = true;
    if (!form.description.trim()) e.description = true;
    if (!form.startDate) e.startDate = true;
    if (!form.technologies.trim()) e.technologies = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editId !== null) {
      setProjects(prev => prev.map(p => p.id === editId ? { ...form, id: editId } : p));
      setEditId(null);
    } else {
      setProjects(prev => [...prev, { ...form, id: Date.now() }]);
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (proj) => {
    setForm({ title: proj.title, description: proj.description, startDate: proj.startDate, endDate: proj.endDate, technologies: proj.technologies, status: proj.status, link: proj.link });
    setEditId(proj.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setErrors({});
  };

  const fmt = (d) => {
    if (!d) return null;
    const [y, m, day] = d.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[+m-1]} ${day}, ${y}`;
  };

  return (
    <>
      <style>{css}</style>

      {/* NAVBAR */}
      <nav className="pt-nav">
        <div className="pt-nav-logo">My Kaksha <span>✦</span></div>
        <button className="pt-back-btn" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </nav>

      {/* BLOBS */}
      <div className="pt-blob pt-b1" />
      <div className="pt-blob pt-b2" />

      <div className="pt-page">

        {/* HEADER */}
        <div className="pt-header">
          <FadeIn>
            <div className="pt-tag"><div className="pt-dot" /> Project Tracker</div>
            <h1 className="pt-title">Track your <span>Projects</span> ✦</h1>
            <p className="pt-subtitle">Organize and showcase the projects you've built — from ideas to shipped products.</p>
          </FadeIn>
        </div>

        {/* STATS BAR */}
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

        {/* ADD PROJECT SECTION */}
        <div className="pt-section">
          <FadeIn delay={100}>
            <div className="pt-section-header">
              <div className="pt-section-title">
                {showForm ? (editId ? "✏️ Edit Project" : "✨ Add New Project") : "📁 Your Projects"}
              </div>
              {!showForm && (
                <button className="pt-toggle-btn" onClick={() => setShowForm(true)}>
                  + Add Project
                </button>
              )}
            </div>

            {/* FORM */}
            <div className={`pt-form-wrap ${showForm ? "" : "hidden"}`}>
              <div className="pt-form-grid">
                {/* Title */}
                <div className={`pt-field ${errors.title ? "error" : ""}`}>
                  <label className="pt-label">📌 Project Title *</label>
                  <input className="pt-input" placeholder="e.g. My Kaksha Dashboard" value={form.title}
                    style={errors.title ? { borderColor: "#FFBBAA" } : {}}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                {/* Status */}
                <div className="pt-field">
                  <label className="pt-label">🏷️ Status</label>
                  <select className="pt-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>

                {/* Description */}
                <div className="pt-field pt-form-full">
                  <label className="pt-label">📝 Description *</label>
                  <textarea className="pt-textarea" placeholder="Briefly describe what this project is about..."
                    value={form.description} style={errors.description ? { borderColor: "#FFBBAA" } : {}}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                {/* Dates */}
                <div className="pt-field">
                  <label className="pt-label">📅 Start Date *</label>
                  <input type="date" className="pt-input" value={form.startDate}
                    style={errors.startDate ? { borderColor: "#FFBBAA" } : {}}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="pt-field">
                  <label className="pt-label">📅 End Date <span style={{ color: "#C8B6A6", fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>(optional)</span></label>
                  <input type="date" className="pt-input" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>

                {/* Technologies */}
                <div className="pt-field pt-form-full">
                  <label className="pt-label">⚙️ Technologies Used *</label>
                  <input className="pt-input" placeholder="e.g. React, Node.js, Firebase (comma separated)"
                    value={form.technologies} style={errors.technologies ? { borderColor: "#FFBBAA" } : {}}
                    onChange={e => setForm(f => ({ ...f, technologies: e.target.value }))} />
                </div>

                {/* Link */}
                <div className="pt-field pt-form-full">
                  <label className="pt-label">🔗 Project Link <span style={{ color: "#C8B6A6", fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>(GitHub or Demo — optional)</span></label>
                  <input className="pt-input" placeholder="https://github.com/yourproject"
                    value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
                </div>
              </div>

              <div className="pt-form-actions">
                <button className="pt-submit-btn" onClick={handleSubmit}>
                  {editId ? "✔ Save Changes" : "✨ Add Project"}
                </button>
                <button className="pt-cancel-btn" onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* PROJECTS DISPLAY */}
        {!showForm && (
          <div className="pt-section">
            <div className="pt-grid">
              {projects.length === 0 ? (
                <div className="pt-empty">
                  <span className="pt-empty-icon">🗂️</span>
                  <div className="pt-empty-title">No projects yet!</div>
                  <div className="pt-empty-desc">Click "Add Project" to showcase your work.</div>
                </div>
              ) : (
                projects.map((proj, i) => (
                  <FadeIn key={proj.id} delay={i * 80}>
                    <div className="pt-card">
                      <div className="pt-card-deco1" />
                      <div className="pt-card-deco2" />

                      <div className="pt-card-top">
                        <div className="pt-card-title">{proj.title}</div>
                        <div className="pt-card-actions">
                          <button className="pt-icon-btn" title="Edit" onClick={() => handleEdit(proj)}>✏️</button>
                          <button className="pt-icon-btn del" title="Delete" onClick={() => handleDelete(proj.id)}>🗑</button>
                        </div>
                      </div>

                      <span className={`pt-badge ${proj.status === "Completed" ? "completed" : "inprogress"}`}>
                        {proj.status === "Completed" ? "✔ " : "⏳ "}{proj.status}
                      </span>

                      <p className="pt-card-desc">{proj.description}</p>

                      <div className="pt-card-dates">
                        <div className="pt-date-chip">📅 {fmt(proj.startDate)}</div>
                        {proj.endDate && <div className="pt-date-chip">🏁 {fmt(proj.endDate)}</div>}
                      </div>

                      <div className="pt-techs">
                        {proj.technologies.split(",").map((t, ti) => (
                          <span key={ti} className="pt-tech-tag">{t.trim()}</span>
                        ))}
                      </div>

                      {proj.link && (
                        <div className="pt-card-link">
                          <a href={proj.link} target="_blank" rel="noopener noreferrer">
                            🔗 View Project →
                          </a>
                        </div>
                      )}
                    </div>
                  </FadeIn>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
