import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Report from "./pages/Report";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="navbar">
          <div className="nav-logo">
            <Link to="/">SmartReport</Link>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/report">Report</Link>
          </div>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2024 Smart Report Generator. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
