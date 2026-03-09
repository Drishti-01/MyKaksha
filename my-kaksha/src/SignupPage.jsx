import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; }

  .auth-shell {
    min-height: 100vh;
    background: radial-gradient(circle at top right, #f5efe6 0%, #faf8f3 55%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    font-family: 'Poppins', sans-serif;
    color: #5a4a3a;
  }

  .auth-card {
    width: min(460px, 100%);
    background: #fffdf9;
    border-radius: 28px;
    padding: 36px;
    box-shadow: 0 22px 70px rgba(140, 111, 94, 0.18);
    border: 1px solid #eed6c4;
  }

  .auth-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #8b6f5e;
    background: #f5efe6;
    border: 1px solid #eed6c4;
    border-radius: 999px;
    padding: 6px 16px;
    margin-bottom: 18px;
  }

  .auth-card h1 {
    margin: 0 0 6px;
    font-size: 2rem;
    color: #4a3728;
  }

  .auth-sub {
    margin: 0 0 24px;
    color: #8b6f5e;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .auth-form {
    display: grid;
    gap: 16px;
  }

  .auth-field label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: #7a5b49;
    margin-bottom: 6px;
  }

  .auth-field input {
    width: 100%;
    border-radius: 16px;
    border: 1.5px solid #eed6c4;
    background: #faf5ef;
    padding: 12px 16px;
    font-size: 0.95rem;
    font-family: inherit;
    color: #4a3728;
  }

  .auth-field input:focus {
    outline: none;
    border-color: #c8b6a6;
    box-shadow: 0 0 0 3px rgba(200, 182, 166, 0.25);
  }

  .auth-btn {
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #c8b6a6, #8b6f5e);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    padding: 14px;
    cursor: pointer;
    box-shadow: 0 12px 30px rgba(139, 111, 94, 0.25);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  .auth-btn:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px rgba(139, 111, 94, 0.35);
  }

  .auth-foot {
    margin-top: 18px;
    font-size: 0.9rem;
    color: #8b6f5e;
    text-align: center;
  }

  .auth-foot a {
    color: #8b6f5e;
    font-weight: 700;
    text-decoration: none;
  }

  .auth-foot a:hover {
    text-decoration: underline;
  }

  .auth-message {
    font-size: 0.85rem;
    border-radius: 12px;
    padding: 10px 14px;
  }

  .auth-message.error {
    background: #ffeae5;
    color: #a14a3d;
    border: 1px solid #f7c7bc;
  }

  .auth-message.success {
    background: #e9f5f1;
    color: #2f7a62;
    border: 1px solid #b4e1cf;
  }
`;

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [state, setState] = useState({ loading: false, message: "", type: "" });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setState({ loading: false, message: "Passwords do not match", type: "error" });
      return;
    }

    setState({ loading: true, message: "", type: "" });

    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Unable to create account");
      }

      setState({ loading: false, message: "Account created! Redirecting...", type: "success" });
      setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      setState({ loading: false, message: error.message || "Signup failed", type: "error" });
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-badge"><span role="img" aria-hidden="true">🌿</span> Step 1 · Create your study space</div>
          <h1>Create your study space</h1>
          <p className="auth-sub">Set up your cozy My Kaksha account so we can save your goals, streaks, and study progress.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Aanya Sharma" required />
            </div>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
            </div>

            {state.message ? (
              <div className={`auth-message ${state.type === "error" ? "error" : "success"}`}>
                {state.message}
              </div>
            ) : null}

            <button type="submit" className="auth-btn" disabled={state.loading}>
              {state.loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div className="auth-foot">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
