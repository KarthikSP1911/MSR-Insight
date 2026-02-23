import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [data, setData] = useState("");

    useEffect(() => {
        axios.get("http://localhost:5000/api/fastapi")
            .then(res => setData(res.data.message))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="home-container" style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="hero">
                <h1>{data || "Smart Report Generator"}</h1>
                <p>Generate intelligent reports with AI power.</p>
                <div className="cta-buttons">
                    <a href="/report" className="btn-primary">View Report</a>
                </div>
            </header>
        </div>
    );
};

export default Home;
