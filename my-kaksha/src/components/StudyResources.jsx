import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createStudyResource,
  fetchPostgresStatus,
  fetchResourceCategories,
  fetchStudyResources,
  removeStudyResource,
  updateStudyResource,
} from "../api/studyResources";
import { useAuth } from "../auth/useAuth";
import AppSidebar from "./AppSidebar";
import useSidebarState from "./useSidebarState";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .sr-shell {
    min-height: 100vh;
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 280px 1fr;
    background: radial-gradient(circle at top right, #f3e8da 0%, #faf8f3 42%);
    color: #5a4a3a;
    font-family: 'Poppins', sans-serif;
  }
  .sr-shell.collapsed { grid-template-columns: 94px 1fr; }
  .sr-main {
    padding: 32px 40px 48px;
    overflow-y: auto;
    height: 100vh;
    min-width: 0;
  }

  .sr-head {
    background: linear-gradient(130deg, #fffdf9, #f7f0e6);
    border: 1px solid #eed6c4;
    border-radius: 24px;
    padding: 28px;
    margin-bottom: 24px;
  }
  .sr-title { margin: 0 0 8px; color: #4a3728; font-size: clamp(1.5rem, 2.2vw, 2rem); font-weight: 800; }
  .sr-sub { margin: 0; color: #8b6f5e; line-height: 1.6; max-width: 720px; }
  .sr-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    border: 1px solid #d6e8dc;
    background: #eef8f2;
    color: #3d6b52;
  }
  .sr-badge.off { border-color: #f7c7bc; background: #ffeae5; color: #a14a3d; }

  .sr-banner {
    margin-bottom: 20px;
    padding: 14px 18px;
    border-radius: 16px;
    border: 1px solid #f7c7bc;
    background: #ffeae5;
    color: #a14a3d;
  }

  .sr-grid {
    display: grid;
    grid-template-columns: minmax(280px, 360px) 1fr;
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .sr-grid { grid-template-columns: 1fr; }
    .sr-shell, .sr-shell.collapsed { grid-template-columns: 1fr; }
  }

  .sr-card {
    background: #fffdf9;
    border: 1px solid #eed6c4;
    border-radius: 20px;
    padding: 22px;
  }
  .sr-card h2 { margin: 0 0 16px; font-size: 1.1rem; color: #4a3728; }

  .sr-field { display: grid; gap: 6px; margin-bottom: 14px; }
  .sr-field label { font-size: 0.82rem; font-weight: 600; color: #8b6f5e; }
  .sr-field input,
  .sr-field select,
  .sr-field textarea {
    width: 100%;
    border: 1px solid #eed6c4;
    border-radius: 12px;
    padding: 10px 12px;
    font-family: inherit;
    background: #faf8f3;
    color: #4a3728;
  }
  .sr-field textarea { min-height: 80px; resize: vertical; }

  .sr-btn {
    border: none;
    border-radius: 999px;
    padding: 10px 20px;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .sr-btn.primary {
    background: linear-gradient(135deg, #c8b6a6, #8b6f5e);
    color: #fff;
  }
  .sr-btn.ghost {
    background: #f5efe6;
    color: #8b6f5e;
    border: 1px solid #eed6c4;
  }
  .sr-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  .sr-list { display: grid; gap: 12px; }
  .sr-item {
    border: 1px solid #eed6c4;
    border-radius: 16px;
    padding: 16px;
    background: #fffdf9;
  }
  .sr-item-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .sr-item h3 { margin: 0 0 6px; color: #4a3728; font-size: 1rem; }
  .sr-meta { font-size: 0.78rem; color: #8b6f5e; margin-bottom: 8px; }
  .sr-link { color: #6b8f71; word-break: break-all; font-size: 0.9rem; }
  .sr-notes { margin: 8px 0 0; color: #5a4a3a; font-size: 0.88rem; line-height: 1.5; }
  .sr-chip {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: #f5efe6;
    border: 1px solid #eed6c4;
    font-size: 0.72rem;
    font-weight: 600;
    color: #8b6f5e;
    white-space: nowrap;
  }
  .sr-empty {
    text-align: center;
    padding: 40px 20px;
    color: #8b6f5e;
    border: 1px dashed #eed6c4;
    border-radius: 16px;
  }
`;

const navItems = ["Dashboard", "Analytics", "Projects", "Resources", "Study Group"];

const emptyForm = { title: "", url: "", notes: "", categoryId: "" };

export default function StudyResources() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [collapsed, setCollapsed] = useSidebarState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postgres, setPostgres] = useState(null);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [pgStatus, categoryList, resourceList] = await Promise.all([
        fetchPostgresStatus(),
        fetchResourceCategories(),
        fetchStudyResources(),
      ]);
      setPostgres(pgStatus);
      setCategories(categoryList);
      setResources(resourceList);
      setError("");
      if (!form.categoryId && categoryList[0]?.id) {
        setForm((prev) => ({ ...prev, categoryId: categoryList[0].id }));
      }
    } catch (err) {
      setError(err.message || "Unable to load study resources.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const byCategory = {};
    for (const resource of resources) {
      const name = resource.category?.name || "Uncategorized";
      byCategory[name] = (byCategory[name] || 0) + 1;
    }
    return byCategory;
  }, [resources]);

  function handleNav(item) {
    if (item === "Resources") return;
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
      return;
    }
    if (item === "Study Group") {
      navigate("/study-group");
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });
  }

  function startEdit(resource) {
    setEditingId(resource.id);
    setForm({
      title: resource.title,
      url: resource.url,
      notes: resource.notes || "",
      categoryId: resource.categoryId,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateStudyResource(editingId, form);
      } else {
        await createStudyResource(form);
      }
      resetForm();
      const resourceList = await fetchStudyResources();
      setResources(resourceList);
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(resourceId) {
    setError("");
    try {
      await removeStudyResource(resourceId);
      setResources((prev) => prev.filter((item) => item.id !== resourceId));
      if (editingId === resourceId) resetForm();
    } catch (err) {
      setError(err.message || "Delete failed.");
    }
  }

  const postgresReady = postgres?.configured && postgres?.connected;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`sr-shell ${collapsed ? "collapsed" : ""}`}>
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          navItems={navItems}
          activeItem="Resources"
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
          noteText="Bookmark study links in PostgreSQL via Prisma."
          navAriaLabel="Study resources navigation"
          loading={loading}
        />

        <main className="sr-main">
          <header className="sr-head">
            <h1 className="sr-title">Study Resources</h1>
            <p className="sr-sub">
              Save useful videos, articles, and docs. This page is a standalone feature using
              PostgreSQL and Prisma — your rooms, chat, and projects still use MongoDB.
            </p>
            <span className={`sr-badge ${postgresReady ? "" : "off"}`}>
              PostgreSQL: {postgresReady ? "connected" : postgres?.configured ? "not connected" : "not configured"}
            </span>
          </header>

          {error ? <div className="sr-banner">{error}</div> : null}

          {!postgresReady && !loading ? (
            <div className="sr-banner">
              Add <code>DATABASE_URL</code> to <code>.env</code>, then run{" "}
              <code>npx prisma migrate dev</code> and restart the server.
            </div>
          ) : null}

          <div className="sr-grid">
            <section className="sr-card">
              <h2>{editingId ? "Edit resource" : "Add resource"}</h2>
              <form onSubmit={handleSubmit}>
                <div className="sr-field">
                  <label htmlFor="sr-title">Title</label>
                  <input
                    id="sr-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. React docs — useEffect"
                    required
                  />
                </div>
                <div className="sr-field">
                  <label htmlFor="sr-url">URL</label>
                  <input
                    id="sr-url"
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="sr-field">
                  <label htmlFor="sr-category">Category</label>
                  <select
                    id="sr-category"
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sr-field">
                  <label htmlFor="sr-notes">Notes (optional)</label>
                  <textarea
                    id="sr-notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Why this link is useful..."
                  />
                </div>
                <div className="sr-actions">
                  <button type="submit" className="sr-btn primary" disabled={saving || !postgresReady}>
                    {saving ? "Saving..." : editingId ? "Update" : "Add"}
                  </button>
                  {editingId ? (
                    <button type="button" className="sr-btn ghost" onClick={resetForm}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section>
              {Object.keys(stats).length > 0 ? (
                <p className="sr-meta" style={{ marginBottom: 16 }}>
                  {resources.length} saved —{" "}
                  {Object.entries(stats)
                    .map(([name, count]) => `${name}: ${count}`)
                    .join(" · ")}
                </p>
              ) : null}

              {loading ? (
                <div className="sr-empty">Loading resources...</div>
              ) : resources.length === 0 ? (
                <div className="sr-empty">No resources yet. Add your first study link on the left.</div>
              ) : (
                <div className="sr-list">
                  {resources.map((resource) => (
                    <article key={resource.id} className="sr-item">
                      <div className="sr-item-top">
                        <div>
                          <h3>{resource.title}</h3>
                          <div className="sr-meta">
                            {resource.category?.name || "Uncategorized"} ·{" "}
                            {new Date(resource.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="sr-chip">{resource.category?.slug || "link"}</span>
                      </div>
                      <a className="sr-link" href={resource.url} target="_blank" rel="noreferrer">
                        {resource.url}
                      </a>
                      {resource.notes ? <p className="sr-notes">{resource.notes}</p> : null}
                      <div className="sr-actions" style={{ marginTop: 12 }}>
                        <button type="button" className="sr-btn ghost" onClick={() => startEdit(resource)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="sr-btn ghost"
                          onClick={() => handleDelete(resource.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
