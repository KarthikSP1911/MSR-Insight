"use client";

import React, { useState, useMemo } from "react";
import { Sparkles, Calendar } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface SimulatorSectionProps {
    studentName: string;
    currentSem: any[];
    predictedGrades: Record<string, string>;
    simulatedCredits: Record<string, number>;
    setPredictedGrades: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setSimulatedCredits: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    currentCgpa: string | null;
    totalCredits: number;
    GRADE_COLORS: Record<string, string>;
    GRADE_POINTS: Record<string, number>;
}

const SimulatorSection: React.FC<SimulatorSectionProps> = ({
    studentName,
    currentSem,
    predictedGrades,
    simulatedCredits,
    setPredictedGrades,
    setSimulatedCredits,
    currentCgpa,
    totalCredits,
    GRADE_COLORS,
    GRADE_POINTS
}) => {
    const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<any>(null);

    // 1. Prediction Logic (Memoized for performance)
    const { projSGPA, projCGPA } = useMemo(() => {
        let currentTotalPts = 0; 
        let currentTotalCredits = 0;
        
        currentSem.forEach((subj: any) => {
            const credits = simulatedCredits[subj.code] ?? 4; 
            const g = predictedGrades[subj.code] || 'O';
            currentTotalPts += (GRADE_POINTS[g] || 0) * credits;
            currentTotalCredits += credits;
        });
        
        const sgpa = currentTotalCredits > 0 ? (currentTotalPts / currentTotalCredits) : 0;
        const historicalCredits = totalCredits;
        const completedPts = parseFloat(currentCgpa || "0") * historicalCredits;
        const cgpa = (historicalCredits + currentTotalCredits) > 0 
            ? (completedPts + currentTotalPts) / (historicalCredits + currentTotalCredits)
            : 0;
            
        return { projSGPA: sgpa, projCGPA: cgpa };
    }, [currentSem, simulatedCredits, predictedGrades, totalCredits, currentCgpa, GRADE_POINTS]);

    // 2. Heatmap Logic (Shifted to Monday Start)
    const { weeks, COLORS } = useMemo(() => {
        const parseDStr = (s: string) => {
            const p = s.split('-');
            return new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime();
        };

        const attendanceMap: Record<string, { present: number, absent: number, presentSubjects: string[], absentSubjects: string[] }> = {};
        const allTimepoints: number[] = [];

        currentSem.forEach((subj: any) => {
            (subj.attendance_details?.present_dates || []).forEach((d: string) => {
                const t = parseDStr(d);
                allTimepoints.push(t);
                if (!attendanceMap[d]) attendanceMap[d] = { present: 0, absent: 0, presentSubjects: [], absentSubjects: [] };
                attendanceMap[d].present += 1;
                attendanceMap[d].presentSubjects.push(subj.name);
            });
            (subj.attendance_details?.absent_dates || []).forEach((d: string) => {
                const t = parseDStr(d);
                allTimepoints.push(t);
                if (!attendanceMap[d]) attendanceMap[d] = { present: 0, absent: 0, presentSubjects: [], absentSubjects: [] };
                attendanceMap[d].absent += 1;
                attendanceMap[d].absentSubjects.push(subj.name);
            });
        });

        const now = new Date();
        const sixMonthsAgo = now.getTime() - (180 * 86400000);
        const minTime = allTimepoints.length ? Math.min(...allTimepoints) : sixMonthsAgo;
        
        const startDate = new Date(minTime);
        startDate.setDate(1); // Start from the 1st of the month data begins
        const startDay = startDate.getDay();
        const diffToMon = startDay === 0 ? 6 : startDay - 1;
        startDate.setDate(startDate.getDate() - diffToMon);
        
        // To "fill the screen" as requested, we'll show exactly 24 weeks (approx 6 months) 
        // starting from our calculated startDate.
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (24 * 7)); 

        const calculatedWeeks: any[] = [];
        let currentWeek: any[] = [];
        let iterDate = new Date(startDate);

        while (iterDate <= endDate) {
            const dayOfWeekIdx = iterDate.getDay();
            const shiftedIdx = dayOfWeekIdx === 0 ? 6 : dayOfWeekIdx - 1; // Mon=0, Sun=6

            const dStr = `${String(iterDate.getDate()).padStart(2, '0')}-${String(iterDate.getMonth() + 1).padStart(2, '0')}-${iterDate.getFullYear()}`;
            const stats = attendanceMap[dStr] || { present: 0, absent: 0, presentSubjects: [], absentSubjects: [] };
            
            currentWeek.push({
                dateStr: dStr,
                niceDate: iterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                present: stats.present,
                absent: stats.absent,
                presentSubjects: stats.presentSubjects,
                absentSubjects: stats.absentSubjects,
                dayIdx: shiftedIdx,
                month: iterDate.toLocaleDateString('en-US', { month: 'short' }),
            });

            if (shiftedIdx === 6) {
                calculatedWeeks.push(currentWeek);
                currentWeek = [];
            }
            iterDate.setDate(iterDate.getDate() + 1);
        }

        const heatmapColors: Record<number, string> = {
            [-1]: '#EF4444', 
            0: '#1e293b',
            1: '#064e3b',
            2: '#065f46',
            3: '#059669',
            4: '#10b981'
        };

        return { weeks: calculatedWeeks, COLORS: heatmapColors };
    }, [currentSem, totalCredits, currentCgpa]);

    const getLevel = (p: number, a: number) => {
        if (p === 0 && a === 0) return 0;
        if (p === 0 && a > 0) return -1;
        if (p === 1) return 1;
        if (p === 2) return 2;
        if (p === 3) return 3;
        return 4;
    };

    return (
        <div className="tab-content">
            <DashboardHeader name={studentName} sectionTitle="Interactive Simulator" sectionSubtitle="Experiment with your grades and explore your global attendance" />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="chart-card predictor-card">
                    <div className="chart-header">
                        <h3 className="chart-title"><Sparkles size={18} style={{ display: 'inline', color: '#10b981', marginRight: '6px', verticalAlign: '-3px' }} /> "What-If" Predictor</h3>
                        <p className="chart-subtitle">Precision Grade & Credit Simulation</p>
                    </div>
                    <div className="predictor-container">
                        <div className="predictor-layout">
                            <div className="predictor-scoreboard">
                                <div className="score-item sgpa">
                                    <div className="score-label">Projected SGPA</div>
                                    <div className="score-value">{projSGPA.toFixed(2)}</div>
                                </div>
                                <div className="score-divider" />
                                <div className="score-item cgpa">
                                    <div className="score-label">Projected CGPA</div>
                                    <div className="score-value">{projCGPA.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="predictor-controls">
                                <div className="controls-header">
                                    <span>Subject</span>
                                    <div className="controls-labels">
                                        <span className="label-credits">Credits</span>
                                        <span className="label-grade">Grade</span>
                                    </div>
                                </div>
                                <div className="controls-scrollable">
                                    {currentSem.map((subj: any) => {
                                        const currentGrade = predictedGrades[subj.code] || 'O';
                                        return (
                                            <div key={subj.code} className="subject-row">
                                                <div className="subj-info">
                                                    <div className="subj-name" title={subj.name}>{subj.name}</div>
                                                    <div className="subj-code">{subj.code}</div>
                                                </div>
                                                <div className="subj-pickers">
                                                    <select 
                                                        value={simulatedCredits[subj.code] ?? 4} 
                                                        onChange={(e) => setSimulatedCredits({...simulatedCredits, [subj.code]: parseInt(e.target.value)})}
                                                        className="simulator-select credit-select"
                                                    >
                                                        {[0,1,2,3,4,5].map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <select 
                                                        value={currentGrade} 
                                                        onChange={(e) => setPredictedGrades({...predictedGrades, [subj.code]: e.target.value})}
                                                        className="simulator-select grade-select"
                                                        style={{ color: GRADE_COLORS[currentGrade] }}
                                                    >
                                                        {Object.keys(GRADE_POINTS).map(g => (
                                                            <option key={g} value={g} style={{ color: '#fff', background: '#1e293b' }}>{g}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="chart-card wide-chart">
                    <div className="chart-header">
                        <h3 className="chart-title"><Calendar size={18} style={{ display: 'inline', color: '#10b981', marginRight: '6px', verticalAlign: '-3px' }} /> Global Attendance Heatmap</h3>
                    </div>
                    <div className="chart-body" style={{ overflowX: 'auto', padding: '10px 0' }}>
                        <div className="github-heatmap-container">
                            <div className="heatmap-header-row">
                                <div className="day-label-cols" />
                                <div className="weeks-labels-container">
                                    {weeks.map((w, idx) => {
                                        const showMonth = idx === 0 || (w[0].month !== weeks[idx-1][0].month);
                                        return (
                                            <div key={idx} className="month-label-col">
                                                {showMonth ? <span className="month-name-tag">{w[0].month}</span> : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="heatmap-grid-core">
                                <div className="day-labels">
                                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                </div>
                                <div className="weeks-container">
                                    {weeks.map((week, wIdx) => (
                                        <div key={wIdx} className="heatmap-column">
                                            {Array.from({ length: 7 }).map((_, dIdx) => {
                                                const day = week.find((d: any) => d.dayIdx === dIdx);
                                                if (!day) return <div key={dIdx} className="heatmap-square empty" />;
                                                const level = getLevel(day.present, day.absent);
                                                const isSelected = selectedHeatmapDay?.dateStr === day.dateStr;
                                                return (
                                                    <div 
                                                        key={dIdx} 
                                                        className={`heatmap-square level-${level}`} 
                                                        style={{ 
                                                            background: COLORS[level], 
                                                            cursor: 'pointer', 
                                                            outline: isSelected ? '2px solid #fff' : 'none',
                                                            zIndex: isSelected ? 10 : 1
                                                        }}
                                                        title={`${day.niceDate}: ${day.present} present, ${day.absent} absent`}
                                                        onClick={() => setSelectedHeatmapDay(day)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="heatmap-footer">
                                <div className="legend">
                                    <span>Less</span>
                                    <div className="heatmap-square" style={{ background: COLORS[0] }} />
                                    <div className="heatmap-square" style={{ background: COLORS[1] }} />
                                    <div className="heatmap-square" style={{ background: COLORS[2] }} />
                                    <div className="heatmap-square" style={{ background: COLORS[3] }} />
                                    <div className="heatmap-square" style={{ background: COLORS[4] }} />
                                    <span>More</span>
                                </div>
                            </div>
                        </div>
                        
                        {selectedHeatmapDay && (
                            <div className="heatmap-details-panel">
                                <div className="details-header">
                                    <h4 className="details-title">Details for {selectedHeatmapDay.niceDate}</h4>
                                    <button className="close-details" onClick={() => setSelectedHeatmapDay(null)}>&times;</button>
                                </div>
                                <div className="details-content">
                                    <div className="details-section">
                                        <div className="section-title" style={{ color: '#10b981' }}>Attended ({selectedHeatmapDay.present})</div>
                                        {selectedHeatmapDay.presentSubjects.length > 0 ? (
                                            <ul className="subject-list">
                                                {selectedHeatmapDay.presentSubjects.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                            </ul>
                                        ) : <p className="no-data">No classes attended</p>}
                                    </div>
                                    <div className="details-section">
                                        <div className="section-title" style={{ color: '#ef4444' }}>Missed ({selectedHeatmapDay.absent})</div>
                                        {selectedHeatmapDay.absentSubjects.length > 0 ? (
                                            <ul className="subject-list">
                                                {selectedHeatmapDay.absentSubjects.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                            </ul>
                                        ) : <p className="no-data">No classes missed</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimulatorSection;
