"use client";

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const placementData = {
  ISE: [
    { name: "IBM India", value: 21, color: "#4F46E5" },
    { name: "Infosys", value: 13, color: "#06B6D4" },
    { name: "Zebra Tech.", value: 7, color: "#8B5CF6" },
    { name: "Nous InfoSystems", value: 6, color: "#10B981" },
    { name: "Oracle", value: 5, color: "#F59E0B" },
    { name: "Mphasis", value: 5, color: "#3B82F6" },
    { name: "HPE", value: 4, color: "#EC4899" },
    { name: "Others (20+ Companies)", value: 39, color: "#64748B" }
  ],
  CSE: [],
  ECE: []
};

export default function PlacementAnalytics() {
    const [branch, setBranch] = useState<'ISE' | 'CSE' | 'ECE'>('ISE');
    const [isMobile, setIsMobile] = useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <section className="placements-section" id="placements">
            <div className="container">
                <div className="section-intro">
                    <h2 className="section-title">2026 Batch Placements</h2>
                    <p className="section-subtitle">Real-time placement analytics for top recruiters across departments.</p>
                </div>
                
                <div className="placements-container fade-up-animate">
                    <div className="placements-header">
                        <h3>Placement Distribution</h3>
                        <select 
                            className="branch-select" 
                            value={branch} 
                            onChange={(e) => setBranch(e.target.value as 'ISE' | 'CSE' | 'ECE')}
                        >
                            <option value="ISE">Information Science (ISE)</option>
                            <option value="CSE">Computer Science (CSE)</option>
                            <option value="ECE">Electronics (ECE)</option>
                        </select>
                    </div>
                    
                    <div className="chart-wrapper">
                        {placementData[branch].length > 0 ? (
                            <ResponsiveContainer width="100%" height={isMobile ? 450 : 350}>
                                <PieChart>
                                    <Pie
                                        data={placementData[branch]}
                                        cx="50%"
                                        cy={isMobile ? "35%" : "50%"}
                                        innerRadius={isMobile ? 60 : 80}
                                        outerRadius={isMobile ? 100 : 130}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {placementData[branch].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff', fontWeight: 600 }}
                                        formatter={(value: any, name: any) => [`${value} Students`, name]}
                                    />
                                    <Legend 
                                        layout={isMobile ? "horizontal" : "vertical"} 
                                        verticalAlign={isMobile ? "bottom" : "middle"} 
                                        align={isMobile ? "center" : "right"} 
                                        wrapperStyle={{ 
                                            fontSize: isMobile ? '11px' : '14px', 
                                            color: '#A1A1A1',
                                            paddingTop: isMobile ? '20px' : '0'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                </div>
                                <span style={{ color: '#737373', fontSize: '1rem', fontWeight: 500 }}>Data not yet uploaded</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
