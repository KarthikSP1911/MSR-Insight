import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Home from "./pages/Home";
import Report from "./pages/Report";
import "./App.css";

function Navbar() {
  const location = useLocation();
  const isReportPage = location.pathname.startsWith("/report/");

  const handleDownloadPDF = () => {
    const element = document.getElementById("report-sheet");
    if (!element) {
      alert("Report not found. Please navigate to the Report page first.");
      return;
    }

    // Save original styles
    const origStyle = element.getAttribute("style") || "";

    // Temporarily constrain to exact A4 for capture
    element.style.width = "210mm";
    element.style.maxHeight = "297mm";
    element.style.minHeight = "277mm";
    element.style.overflow = "hidden";
    element.style.padding = "20px 40px 30px 40px";
    element.style.boxShadow = "none";

    // Prevent title from wrapping
    const h1 = element.querySelector(".college-info h1");
    const origH1Style = h1 ? h1.getAttribute("style") || "" : "";
    if (h1) h1.style.whiteSpace = "nowrap";

    const opt = {
      margin: [5, 0, 5, 0], // top, left, bottom, right — minimal top/bottom, no horizontal (handled by padding)
      filename: "Academic_Report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // Restore original styles
        element.setAttribute("style", origStyle);
        if (h1) h1.setAttribute("style", origH1Style);
      });
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link to="/">SmartReport</Link>
      </div>
      <div className="nav-actions">
        {isReportPage ? (
          <button onClick={handleDownloadPDF} className="generate-btn">
            Generate Report
          </button>
        ) : (
          <Link to="/report/1MS24IS400" className="generate-btn">
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
            <Route path="/report/:usn" element={<Report />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
