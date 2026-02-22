import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Report from "./pages/Report";
import "./App.css";

function Navbar() {
  const location = useLocation();
  const isReportPage = location.pathname === "/report";

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SmartReport</Link>
      </div>
      <div className="nav-actions">
        {isReportPage ? (
          <button onClick={() => window.print()} className="generate-btn">
            Generate Report
          </button>
        ) : (
          <Link to="/report" className="generate-btn">
            Generate Report
          </Link>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Navbar />

        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
