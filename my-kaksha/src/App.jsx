import { Routes, Route } from "react-router-dom";
import Landing from "./components/landing";
import Dashboard from "./Dashboard";
import Analytics from "./Analytics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
}
export default App;
