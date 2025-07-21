// src/App.js
import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Box } from "@react-three/drei";
import {
  FaUsers,
  FaArrowUp,
  FaExclamationTriangle,
  FaChartLine,
  FaChartBar,
  FaUserCheck,
  FaCog,
  FaFunnelDollar,
} from "react-icons/fa";

// Component Imports
import FileDropUpload from "./components/FileDropUpload";
import AgentStatusBadge from './components/AgentStatusBadge';
import AgentQA from './components/AgentQA';

import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

async function analyzeSentimentHuggingFace(text) {
  const HUGGING_FACE_API_KEY = process.env.REACT_APP_HF_API_KEY;

  if (!HUGGING_FACE_API_KEY) {
    console.warn("Hugging Face API Key not set. Using fallback sentiment analysis.");
    const s = text.toLowerCase();
    if (["rage", "abandon", "fail", "issue", "terrible", "hate", "worst"].some((k) => s.includes(k)))
      return { label: "🤬 Negative", score: 0.9 };
    if (["happy", "good", "great", "success", "love", "amazing", "perfect"].some((k) => s.includes(k)))
      return { label: "😃 Positive", score: 0.9 };
    return { label: "😶 Neutral", score: 0.9 };
  }

  const API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest";
  const headers = {
    Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API Error:", response.status, errorBody);
      return { label: "😶 Neutral", score: 0.5 };
    }

    const result = await response.json();
    const topResult = result[0]?.[0] || result[0];

    const emojiMap = {
      LABEL_0: "🤬 Negative",
      LABEL_1: "😶 Neutral",
      LABEL_2: "😃 Positive",
      negative: "🤬 Negative",
      neutral: "😶 Neutral",
      positive: "😃 Positive",
    };

    return {
      label: emojiMap[String(topResult.label).toLowerCase()] || "😶 Neutral",
      score: topResult.score || 0.5,
    };
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    return { label: "😶 Neutral", score: 0.5 };
  }
}

const FunnelStyles = () => (
  <style>{`
    /* @import has been removed assuming the font is linked in public/index.html */
    .main-title, h1, h2, h3, h4 {
      font-family: 'DM Sans', Arial, sans-serif !important;
      font-weight: 700;
    }
    .sidebar-logo-area span {
      font-family: 'DM Sans', Arial, sans-serif !important;
    }
    .main-title {
      text-align: center;
      font-size: 2.25rem;
      margin: 32px 0 18px 0;
      letter-spacing: 0.02em;
      color: #222;
    }
    .subtitle {
      text-align: center;
      font-size: 1.15rem;
      color: #666;
      margin: 0 0 28px 0;
    }
    .canvas-container {
      position: relative;
      width: 100%;
      height: 360px;
      overflow: hidden;
      min-height: 0;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    .funnel-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 500px;
      contain: layout style;
      border: 1px solid #e0e0e0;
    }
    .canvas-container canvas {
      width: 100% !important;
      height: 100% !important;
      max-height: 400px;
      display: block;
    }
    * {
      box-sizing: border-box;
    }
    .chart-section {
      min-height: 0;
      min-width: 0;
    }
    .agent-panel {
        position: sticky;
        top: 16px;
        z-index: 10;
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #d5e0ef;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
    }
    @media (max-width: 768px) {
      .canvas-container {
        height: 300px;
      }
      .funnel-wrapper {
        max-height: 350px;
      }
    }
  `}</style>
);

const Dynamic3DFunnel = ({ funnelData }) => {
  if (!funnelData || !funnelData.steps || funnelData.steps.length === 0) {
    return (
      <div style={{
        height: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f7f7',
        borderRadius: 8
      }}>
        <p style={{ fontFamily: "'DM Sans', Arial, sans-serif", color: "#666" }}>
          No funnel data available
        </p>
      </div>
    );
  }

  const maxUsers = funnelData.steps[0]?.users || 1;
  const SEGMENT_HEIGHT = 1;
  const SEGMENT_SPACING = 0.18;
  const n = funnelData.steps.length;
  const totalHeight = n * (SEGMENT_HEIGHT + SEGMENT_SPACING);
  const startY = totalHeight / 2 - SEGMENT_HEIGHT / 2;

  return (
    <>
      <div className="canvas-container">
        <Canvas camera={{ position: [5, 0, 7.5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[20, 10, 10]} intensity={0.7} />
          <Suspense fallback={null}>
            {funnelData.steps.map((step, i) => {
              const ratio = Math.max(0.25, step.users / maxUsers);
              const width = 4 * ratio;
              const y = startY - i * (SEGMENT_HEIGHT + SEGMENT_SPACING);
              const color = step.dropoffRate > 25 ? '#ff6b6b' :
                           step.dropoffRate > 15 ? '#ffd93d' : '#6bcf7f';

              return (
                <group key={i} position={[0, y, 0]}>
                  <Box args={[width, SEGMENT_HEIGHT, 1.25]}>
                    <meshStandardMaterial color={color} />
                  </Box>
                  <Text position={[width / 2 + 0.75, 0.18, 0]} fontSize={0.17} color="#222">
                    {step.name}
                  </Text>
                  <Text position={[width / 2 + 0.75, -0.12, 0]} fontSize={0.14} color="#696969">
                    {step.users?.toLocaleString()} users
                  </Text>
                  {i !== 0 && (
                    <Text position={[width / 2 + 0.75, -0.34, 0]} fontSize={0.12} color={color}>
                      Drop: {step.dropoffRate?.toFixed(1)}%
                    </Text>
                  )}
                </group>
              );
            })}
            <OrbitControls
              enablePan={true}
              enableRotate={true}
              enableZoom={true}
              onStart={(e) => {
                if(e?.target && e.originalEvent) {
                  e.target.enablePan = e.originalEvent.ctrlKey || e.originalEvent.metaKey;
                }
              }}
              onEnd={(e) => {
                if(e?.target) e.target.enablePan = false;
              }}
              mouseButtons={{
                LEFT: 0,
                MIDDLE: 1,
                RIGHT: 2
              }}
              panSpeed={1.2}
              zoomSpeed={1.2}
              rotateSpeed={1.0}
              maxPolarAngle={Math.PI}
              minPolarAngle={0}
            />
          </Suspense>
        </Canvas>
      </div>
      <div style={{
        fontSize: 13,
        color: '#888',
        marginTop: 10,
        textAlign: 'center',
        fontFamily: "'DM Sans', Arial, sans-serif"
      }}>
        Rotate: Drag left/right • Zoom: Scroll • Pan: CTRL + Drag
      </div>
    </>
  );
};

const parseCSV = (txt) => {
  const [header, ...rows] = txt.trim().split("\n");
  const keys = header.split(",").map((x) => x.trim());
  return rows.map((r) =>
    r.split(",")
     .map((x) => x.trim())
     .reduce((acc, val, i) => ({ ...acc, [keys[i]]: val }), {})
  );
};

const useLiveAnalyticsFeed = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const makeData = () => {
      const base = 1000 + Math.floor(Math.random() * 200);
      const funnel = [
        { name: "Homepage Visit", users: base },
        { name: "Signed Up", users: Math.floor(base * (0.6 + Math.random() * 0.1)) },
        { name: "Verified Email", users: Math.floor(base * (0.4 + Math.random() * 0.08)) },
        { name: "Completed Profile", users: Math.floor(base * (0.2 + Math.random() * 0.05)) },
        { name: "First Action", users: Math.floor(base * (0.1 + Math.random() * 0.03)) },
      ];

      const ses = Array.from({ length: 8 }).map(() => {
        const mood = ["positive", "negative", "neutral"][Math.floor(Math.random() * 3)];
        const phrases = {
          positive: ["Great onboarding experience!", "Smooth and intuitive.", "Love the interface!"],
          negative: ["Stuck on verification step.", "Confusing UI design.", "Too many required fields."],
          neutral: ["Browse around.", "Checking out features.", "Reading documentation."],
        };
        return { text: phrases[mood][Math.floor(Math.random() * phrases[mood].length)] };
      });

      const labels = Array.from({ length: 7 }, (_, i) => `${i + 1}h ago`);
      const trendVals = labels.map(() => Math.floor(50 + Math.random() * 150));

      setData({
        funnel,
        user_sessions: ses,
        trend: { labels, data: trendVals },
      });
    };

    makeData();
    const id = setInterval(makeData, 8000);
    return () => clearInterval(id);
  }, []);

  return data;
};

const clusterDropoffReasons = (sessions) => {
  const clusters = {
    technical: {
      keywords: ["error", "loading", "timeout", "crash", "bug", "broken", "failed"],
      sessions: [], impact: 0
    },
    ux_confusion: {
      keywords: ["unclear", "confusing", "dont understand", "where is", "hard to find"],
      sessions: [], impact: 0
    },
    time_pressure: {
      keywords: ["too long", "takes forever", "impatient", "skip", "slow"],
      sessions: [], impact: 0
    },
    value_unclear: {
      keywords: ["why need", "waste of time", "not relevant", "unnecessary"],
      sessions: [], impact: 0
    },
  };

  (sessions || []).forEach((s) => {
    Object.keys(clusters).forEach((k) => {
      if (clusters[k].keywords.some((kw) => (s.text || s).toLowerCase().includes(kw))) {
        clusters[k].sessions.push(s.text || s);
        clusters[k].impact += 1;
      }
    });
  });

  return clusters;
};

const getSolutionForCluster = (c, step) => {
  const solutions = {
    technical: `Add error tracking & graceful retries for "${step.name}".`,
    ux_confusion: `Insert inline help & tooltips for "${step.name}".`,
    time_pressure: `Shorten "${step.name}" by deferring non-critical inputs.`,
    value_unclear: `Improve value messaging before "${step.name}".`,
  };
  return solutions[c] || `Investigate friction at "${step.name}".`;
};

const calculatePotentialImpact = (drop, users) => Math.round((drop / 100) * users);

const generateRecommendations = (funnel, clusters) => {
  const recs = [];
  if (!funnel || !funnel.steps) return recs;

  funnel.steps.forEach((s) => {
    if (s.dropoffRate > 20) {
      const dominantCluster = Object.entries(clusters)
        .sort((a, b) => b[1].impact - a[1].impact)[0]?.[0] || 'ux_confusion';

      recs.push({
        stepId: s.id,
        stepName: s.name,
        severity: s.dropoffRate > 30 ? "high" : "medium",
        issue: dominantCluster,
        solution: getSolutionForCluster(dominantCluster, s),
        estimatedImpact: calculatePotentialImpact(s.dropoffRate, s.users),
      });
    }
  });

  return recs.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
};

const KPI = ({ label, value, icon }) => {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (typeof value !== 'number' && !String(value).match(/^\d/)) {
      setDisplayValue(value);
      return;
    }

    const target = parseFloat(String(value).replace(/[,%]/g, "")) || 0;
    const duration = 800;
    const start = performance.now();

    const animate = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      const current = Math.round(eased * target);

      setDisplayValue(
        label.includes("Conversion") ? `${current}%` : current.toLocaleString()
      );

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [label, value]);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      padding: 24,
      boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <span style={{
        display: "flex",
        alignItems: "center",
        color: "#777",
        fontFamily: "'DM Sans', Arial, sans-serif"
      }}>
        {icon}
        <span style={{ marginLeft: 8 }}>{label}</span>
      </span>
      <span style={{
        fontSize: 36,
        fontWeight: 700,
        color: "#1e2532",
        fontFamily: "'DM Sans', Arial, sans-serif"
      }}>
        {displayValue}
      </span>
    </div>
  );
};

const OnboardingFunnelChart = ({ data }) => {
  if (!data?.length) return null;

  const chartData = {
    labels: data.map((d) => d.name || d.step),
    datasets: [
      {
        label: "Users",
        data: data.map((d) => d.users),
        backgroundColor: "#1976d2",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const i = ctx.dataIndex;
            const value = ctx.raw;
            const prevValue = i > 0 ? chartData.datasets[0].data[i - 1] : value;
            const dropRate = prevValue ? (((prevValue - value) / prevValue) * 100).toFixed(1) : 0;
            return `Users: ${value.toLocaleString()}  (${dropRate}% drop)`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false } }
    },
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      padding: 24,
      flex: 1,
      minWidth: 300,
      position: 'relative',
      height: '450px'
    }}>
      <h3 style={{ marginTop: 0, fontFamily: "'DM Sans', Arial, sans-serif" }}>
        Funnel Breakdown
      </h3>
      <Bar data={chartData} options={options} />
    </div>
  );
};

const TrendLineChart = ({ data }) => {
  if (!data?.labels?.length) return null;

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Users",
        data: data.data,
        borderColor: "#2196f3",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      padding: 24,
      flex: 1,
      minWidth: 300,
      position: 'relative',
      height: '400px'
    }}>
      <h3 style={{ marginTop: 0, fontFamily: "'DM Sans', Arial, sans-serif" }}>
        User Activity Trend
      </h3>
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top" } },
          animation: { duration: 1200, easing: "easeOutQuart" },
        }}
      />
    </div>
  );
};

const SentimentPanel = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: "#fff",
        borderRadius: 8,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        minWidth: 280,
        textAlign: 'center',
        fontFamily: "'DM Sans', Arial, sans-serif"
      }}>
        <h4>User Feedback Sentiment</h4>
        <p style={{ color: "#666" }}>No feedback data available</p>
      </div>
    );
  }

  const counts = data.reduce((acc, s) => {
    const label = s.sentiment || "unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const total = data.length || 1;
  const chartLabels = Object.keys(counts);
  const chartDataValues = Object.values(counts);

  const colorMap = {
    "😃 Positive": "#2e7d32",
    "🤬 Negative": "#d32f2f",
    "😶 Neutral": "#757575",
    "unknown": "#bdbdbd"
  };

  const backgroundColors = chartLabels.map(label => colorMap[label] || '#bdbdbd');

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartDataValues,
        backgroundColor: backgroundColors,
        hoverOffset: 8,
      },
    ],
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      padding: 18,
      width: '100%',
      maxWidth: 400,
      minWidth: 280,
      height: 'auto',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      margin: '0 auto'
    }}>
      <h4 style={{
        margin: '8px 0 16px',
        fontSize: '1.1rem',
        fontWeight: 600,
        textAlign: 'center',
        fontFamily: "'DM Sans', Arial, sans-serif"
      }}>
        User Feedback Sentiment
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '20px' }}>
        <div style={{ width: 130, height: 130, flexShrink: 0 }}>
          <Pie
            data={chartData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              animation: { duration: 800 }
            }}
          />
        </div>
        <ul style={{
          margin: 0,
          fontSize: 13,
          width: '100%',
          padding: 0,
          listStyle: 'none',
          fontFamily: "'DM Sans', Arial, sans-serif"
        }}>
          {chartLabels.map((label, i) => (
            <li key={i} style={{ color: colorMap[label], marginBottom: '8px' }}>
              {label}: {counts[label]} ({((counts[label] / total) * 100).toFixed(1)}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const AgentSummaryPanel = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div>
        <div style={{
          fontWeight: 700,
          fontSize: "1.26rem",
          fontFamily: "'DM Sans', Arial, sans-serif",
          color: "#1976d2",
          marginBottom: 12
        }}>
          🤖 AI Agent is analyzing your onboarding data...
        </div>
      </div>
    );
  }

  if (!analysis?.recommendations?.length) {
    return (
       <div>
        <div style={{
          fontWeight: 700,
          fontSize: "1.26rem",
          fontFamily: "'DM Sans', Arial, sans-serif",
          color: "#1976d2",
          marginBottom: 12
        }}>
          🤖 Upload data to see AI-powered insights and recommendations
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        fontWeight: 700,
        fontSize: "1.26rem",
        fontFamily: "'DM Sans', Arial, sans-serif",
        color: "#1976d2",
        marginBottom: 12
      }}>
        🤖 Your AI Agent found {analysis.recommendations.length} optimization opportunities
      </div>
      <div style={{
        fontSize: "1rem",
        fontFamily: "'DM Sans', Arial, sans-serif",
        color: "#444",
        marginBottom: 10
      }}>
        Priority fixes:
      </div>
      <ul style={{ margin: "10px 0 0 20px", fontFamily: "'DM Sans', Arial, sans-serif", paddingLeft: 0 }}>
        {analysis.recommendations.slice(0, 3).map((rec, idx) => (
          <li key={idx} style={{ marginBottom: 8, listStylePosition: 'inside' }}>
            <strong>{rec.stepName}:</strong> {rec.solution}{" "}
            <span style={{ color: "#388e3c" }}>(Est. Impact: {rec.estimatedImpact} users)</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function App() {
  const [displayData, setDisplayData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [view, setView] = useState("live");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [agentStatus, setAgentStatus] = useState("watching");
  const [prevFunnel, setPrevFunnel] = useState(null);
  const [growthMode, setGrowthMode] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);
  const [investigatingThreshold, setInvestigatingThreshold] = useState(10);
  const [actionThreshold, setActionThreshold] = useState(15);


  const liveData = useLiveAnalyticsFeed();

  const SIDEBAR_SECTIONS = [
    { name: "Dashboard", icon: <FaChartBar /> },
    { name: "Funnels", icon: <FaFunnelDollar /> },
    { name: "Sessions", icon: <FaUserCheck /> },
    { name: "Reports", icon: <FaChartLine /> },
    { name: "Settings", icon: <FaCog /> }
  ];

  const runAnalysis = async (data) => {
    if (!data || !data.funnel || !data.funnel.length) {
      setAnalysis(null);
      return;
    }

    setIsLoading(true);

    try {
      const feedback = data.user_sessions || [];
      const annotatedFeedback = await Promise.all(
        feedback.map(async (f) => {
          const result = await analyzeSentimentHuggingFace(f.text || f);
          return {
            text: f.text || f,
            sentiment: result.label,
            score: result.score,
          };
        })
      );

      const clusters = clusterDropoffReasons(annotatedFeedback);
      const funnelObj = {
        steps: data.funnel.map((s, i, arr) => ({
          id: `step_${i}`,
          name: s.name || s.step,
          users: Number(s.users) || 0,
          dropoffRate: i === 0 || !arr[i-1]?.users ? 0 :
            ((Number(arr[i-1].users) - Number(s.users)) / Number(arr[i-1].users)) * 100,
        })),
      };

      const biggestDrop = funnelObj.steps.length > 1 ?
        funnelObj.steps.slice(1).sort((a,b) => b.dropoffRate - a.dropoffRate)[0] :
        { name: 'N/A', dropoffRate: 0 };

      setAnalysis({
        insights: [
          `Biggest drop-off at "${biggestDrop.name}" (${biggestDrop.dropoffRate.toFixed(1)}%).`,
          `Analyzed ${annotatedFeedback.length} user feedback messages.`,
          `Identified ${Object.values(clusters).filter(c => c.impact > 0).length} friction categories.`
        ],
        recommendations: generateRecommendations(funnelObj, clusters),
        sentiment: annotatedFeedback,
        clusters: clusters
      });
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis({
        insights: ["Analysis completed with basic results."],
        recommendations: [],
        sentiment: [],
        clusters: {}
      });
    }

    setIsLoading(false);
  };

  const handleFileUpload = useCallback((file) => {
    if (!file) return;

    setFileName(file.name);
    const extension = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = async (event) => {
      let parsed = null;

      try {
        if (extension === "csv") {
          const csvData = parseCSV(event.target.result);
          parsed = {
            funnel: csvData,
            user_sessions: []
          };
        } else if (extension === "json") {
          parsed = JSON.parse(event.target.result);
        } else {
          alert("Unsupported file type. Please upload a CSV or JSON file.");
          setFileName("");
          return;
        }

        setDisplayData(parsed);
        await runAnalysis(parsed);
        setView("uploaded");
        setActiveSection("Dashboard");

      } catch (error) {
        console.error("File parsing error:", error);
        alert("Failed to parse the uploaded file. Please check the format.");
        setFileName("");
      }
    };

    reader.readAsText(file);
  }, []);

  const downloadActionPlan = () => {
    if (!displayData || !displayData.funnel) {
      alert("No data available to download.");
      return;
    }

    const funnelSteps = funnelFor3D?.steps || [];
    const recommendations = analysis?.recommendations || [];

    const recMap = recommendations.reduce((acc, rec) => {
      acc[rec.stepName] = rec.solution;
      return acc;
    }, {});

    const csvHeader = ["Step", "Users", "Drop-off %", "Recommendation"].join(",");
    const csvRows = funnelSteps.map(step => [
      `"${step.name.replace(/"/g, '""')}"`,
      step.users,
      step.dropoffRate.toFixed(1),
      `"${(recMap[step.name] || "N/A").replace(/"/g, '""')}"`
    ].join(","));

    const csvContent = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `action-plan-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    setReportDownloaded(true);
    setTimeout(() => setReportDownloaded(false), 4000);
  };
  
  const downloadSampleJSON = () => {
    const sampleData = {
      funnel: [
        {"step": "Create Account", "users": 1000},
        {"step": "Verify Email", "users": 620},
        {"step": "Finish Profile", "users": 280},
        {"step": "Subscribe", "users": 120}
      ],
      user_sessions: [
        "User1: stuck on email verification",
        "User2: abandoned profile setup",
        "User3: The profile completion form is too long and confusing.",
        "User4: I encountered an error after verifying my email.",
        "User5: Why do you need my phone number? This feels unnecessary.",
        "User6: The site crashed when I tried to subscribe.",
        "User7: I don't understand what to do on the profile page."
      ]
    };
    const jsonContent = JSON.stringify(sampleData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sample_onboarding.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    if (displayData) {
      localStorage.setItem('dashboard_analyticsData', JSON.stringify(displayData));
    }
  }, [displayData]);

  useEffect(() => {
    const savedData = localStorage.getItem('dashboard_analyticsData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setDisplayData(parsedData);
        runAnalysis(parsedData);
        setFileName("Restored Session");
        setView('uploaded');
      } catch (error) {
        console.error("Failed to parse saved data:", error);
        localStorage.removeItem('dashboard_analyticsData');
      }
    }
  }, []);

  useEffect(() => {
    if (view === "live" && liveData) {
      setDisplayData(liveData);
      runAnalysis(liveData);
    }
  }, [view, liveData]);

  useEffect(() => {
    if (view === "live" && displayData?.funnel) {
      if (prevFunnel) {
        const spikes = displayData.funnel.map((step, i) => {
          const prevUsers = prevFunnel[i]?.users || 0;
          return prevUsers > 0 ? ((prevUsers - step.users) / prevUsers) * 100 : 0;
        });
        const maxSpike = Math.max(...spikes.slice(1));
        if (maxSpike > actionThreshold) {
            setAgentStatus("action");
        } else if (maxSpike > investigatingThreshold) {
            setAgentStatus("investigating");
        } else {
            setAgentStatus("watching");
        }
      }
      setPrevFunnel(displayData.funnel);
    }
  }, [displayData, view, prevFunnel, actionThreshold, investigatingThreshold]);

  const totalUsers = displayData?.funnel?.[0]?.users?.toLocaleString() || "0";
  const conversionRate = displayData?.funnel?.length > 1 && displayData?.funnel?.[0]?.users > 0
    ? `${((displayData.funnel[displayData.funnel.length - 1].users / displayData.funnel[0].users) * 100).toFixed(0)}`
    : "N/A";
  const biggestDrop = analysis?.recommendations?.length > 0
    ? analysis.recommendations[0].stepName
    : "N/A";

  const funnelFor3D = displayData?.funnel ? {
    steps: displayData.funnel.map((s, i, arr) => ({
      id: s.id || `step_${i}`,
      name: s.step || s.name || `Step ${i + 1}`,
      users: Number(s.users) || Number(s.Count) || 0,
      dropoffRate: i === 0 || !arr[i-1]?.users ? 0 :
        ((Number(arr[i-1].users) - Number(s.users)) / Number(arr[i-1].users)) * 100,
    }))
  } : null;

  return (
    <>
      <FunnelStyles />
      <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fa" }}>

        <aside style={{
          background: "#1e2532",
          color: "#fff",
          width: 250,
          padding: "36px 0 30px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          flexShrink: 0,
        }}>
          <div className="sidebar-logo-area" style={{
            padding: "0 20px 10px 20px",
            textAlign: "center"
          }}>
            <span style={{
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "#fff",
              fontFamily: "'DM Sans', Arial, sans-serif",
              verticalAlign: 'middle'
            }}>
              Analyzer
            </span>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SIDEBAR_SECTIONS.map(section => (
              <button
                key={section.name}
                onClick={() => setActiveSection(section.name)}
                style={{
                  background: activeSection === section.name ? "#1976d2" : "transparent",
                  border: "none",
                  color: "#e0e0e0",
                  fontWeight: 600,
                  padding: "16px 40px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: "'DM Sans', Arial, sans-serif",
                  transition: "background 0.2s ease"
                }}
              >
                {section.icon}
                {section.name}
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ flex: 1, padding: "0 48px 48px", overflowY: 'auto' }}>

          <div>
            <h1 className="main-title">Onboarding Drop-off Analyzer</h1>
            <p className="subtitle">
              Live drop-off tracking, user sentiment, and actionable onboarding insights
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 30
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 24,
                fontFamily: "'DM Sans', Arial, sans-serif"
              }}>
                {activeSection}
              </h2>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              background: "#e0e5ee",
              borderRadius: 8,
              padding: 8,
            }}>
              <button
                onClick={() => setView("live")}
                style={{
                  padding: "10px 15px",
                  borderRadius: 6,
                  border: "none",
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: view === "live" ? "#1976d2" : "transparent",
                  color: view === "live" ? "#fff" : "#444",
                  fontFamily: "'DM Sans', Arial, sans-serif"
                }}
              >
                Live Feed
              </button>
              <button
                onClick={() => setView("uploaded")}
                style={{
                  padding: "10px 15px",
                  borderRadius: 6,
                  border: "none",
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: view === "uploaded" ? "#1976d2" : "transparent",
                  color: view === "uploaded" ? "#fff" : "#444",
                  fontFamily: "'DM Sans', Arial, sans-serif"
                }}
              >
                Your Data
              </button>
            </div>
          </div>

          {activeSection === "Dashboard" && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', Arial, sans-serif"
                  }}>
                    <input type="checkbox" checked={growthMode} onChange={e => setGrowthMode(e.target.checked)} />
                    Enable AI Growth Mode
                  </label>
              </div>

              <div className="agent-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontFamily: "'DM Sans', Arial, sans-serif", color: '#1e2532' }}>
                      AI Agent Panel
                    </h3>
                    {/* NOTE: Ensure AgentStatusBadge colors (especially amber) meet WCAG contrast guidelines. */}
                    <AgentStatusBadge status={agentStatus} aria-label={`Current agent status: ${agentStatus}`} />
                  </div>
                  
                  <AgentSummaryPanel analysis={analysis} isLoading={isLoading} />
                  
                  {growthMode && analysis?.clusters && (
                      <div style={{marginTop: '16px'}}>
                          <h4 style={{ fontFamily: "'DM Sans', Arial, sans-serif", marginTop: 0, marginBottom: '8px' }}>Top Friction Clusters</h4>
                          <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0', fontFamily: "'DM Sans', Arial, sans-serif" }}>
                              {Object.entries(analysis.clusters)
                                  .map(([key, value]) => ({ name: key, impact: value.impact }))
                                  .sort((a, b) => b.impact - a.impact)
                                  .filter(c => c.impact > 0)
                                  .slice(0, 3)
                                  .map(cluster => (
                                      <li key={cluster.name} style={{ listStylePosition: 'inside', marginBottom: '4px' }}>
                                        <span style={{textTransform: 'capitalize'}}>{cluster.name.replace(/_/g, ' ')}</span>: {cluster.impact} sessions identified
                                      </li>
                                  ))
                              }
                          </ul>
                      </div>
                  )}

                  {growthMode && (
                    <div style={{marginTop: '20px'}}>
                      {/* NOTE: The AgentQA component should clear its input and reply on submit for better UX. */}
                      <AgentQA
                        funnel={funnelFor3D?.steps || []}
                        insights={analysis?.insights || []}
                        aria-label="Ask the AI agent a question about your funnel data"
                      />
                      <p style={{fontSize: '12px', color: '#666', marginTop: '8px', fontFamily: "'DM Sans', Arial, sans-serif", textAlign: 'center'}}>
                        Example questions: "Why did users drop off at 'Finish Profile'?" or "Summarize the main issues."
                      </p>
                    </div>
                  )}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                gap: 30,
                marginBottom: 40,
              }}>
                <KPI label="Total Users" value={totalUsers} icon={<FaUsers />} />
                <KPI label="Conversion Rate" value={conversionRate} icon={<FaArrowUp />} />
                <KPI label="Biggest Drop-off" value={biggestDrop} icon={<FaExclamationTriangle />} />
              </div>

              <div className="chart-section" style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 30,
                marginBottom: 40,
                minHeight: 0
              }}>
                <OnboardingFunnelChart data={displayData?.funnel} />

                <div className="funnel-wrapper" style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: 24,
                  flex: 1,
                  minWidth: 450,
                  overflow: 'hidden'
                }}>
                  <h3 style={{
                    marginTop: 0,
                    fontFamily: "'DM Sans', Arial, sans-serif"
                  }}>
                    Interactive 3D Funnel
                  </h3>
                  {funnelFor3D ? (
                    <Dynamic3DFunnel funnelData={funnelFor3D} />
                  ) : (
                    <p style={{
                      textAlign: "center",
                      padding: 40,
                      fontFamily: "'DM Sans', Arial, sans-serif",
                      color: "#666"
                    }}>
                      {view === 'live' ? 'Waiting for live data...' : 'Upload data to see the funnel.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="chart-section" style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 30,
                marginBottom: 40,
                minHeight: 0
              }}>
                <TrendLineChart data={displayData?.trend} />
                <SentimentPanel data={analysis?.sentiment} />
              </div>

              {analysis?.recommendations?.length > 0 && (
                <div style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: 30,
                  marginBottom: 40
                }}>
                  <h2 style={{
                    marginTop: 0,
                    fontFamily: "'DM Sans', Arial, sans-serif"
                  }}>
                    🤖 AI Insights & Recommendations
                  </h2>

                  <h4 style={{
                    marginBottom: 6,
                    fontFamily: "'DM Sans', Arial, sans-serif"
                  }}>
                    Key Insights
                  </h4>
                  <ul style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                    {analysis.insights.map((insight, idx) => (
                      <li key={idx} style={{ marginBottom: 6 }}>{insight}</li>
                    ))}
                  </ul>

                  <h4 style={{
                    marginBottom: 6,
                    marginTop: 24,
                    fontFamily: "'DM Sans', Arial, sans-serif"
                  }}>
                    Priority Recommendations
                  </h4>
                  <ul style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        <strong>{rec.stepName}:</strong> {rec.solution}{" "}
                        <span style={{ color: "#388e3c" }}>
                          (Est. Impact: {rec.estimatedImpact} users)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {activeSection === "Funnels" && (
            <div className="chart-section" style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 30
            }}>
              <div className="funnel-wrapper" style={{
                background: "#fff",
                borderRadius: 8,
                padding: 24,
                flex: '1 1 60%',
                minWidth: 450
              }}>
                <h3 style={{
                  marginTop: 0,
                  fontFamily: "'DM Sans', Arial, sans-serif"
                }}>
                  Interactive 3D Funnel
                </h3>
                {funnelFor3D ? (
                  <Dynamic3DFunnel funnelData={funnelFor3D} />
                ) : (
                  <p style={{
                    textAlign: "center",
                    padding: 40,
                    fontFamily: "'DM Sans', Arial, sans-serif",
                    color: "#666"
                  }}>
                    No funnel data available
                  </p>
                )}
              </div>
              <div style={{ flex: '1 1 35%', minWidth: 300 }}>
                <OnboardingFunnelChart data={displayData?.funnel} />
              </div>
            </div>
          )}

          {activeSection === "Sessions" && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SentimentPanel data={analysis?.sentiment} />
            </div>
          )}

          {activeSection === "Reports" && (
            <div>
              <h2 style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                Download & Compare Reports
              </h2>
              <p style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                Export your onboarding analytics and historical comparison data.
              </p>

              <div style={{ margin: "16px 0", display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  style={{
                    padding: "10px 18px",
                    borderRadius: 6,
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', Arial, sans-serif"
                  }}
                  onClick={downloadActionPlan}
                >
                  📥 Export Action Plan
                </button>
                {reportDownloaded && <span style={{color: '#2e7d32', fontFamily: "'DM Sans', sans-serif"}}>Action Plan downloaded!</span>}
              </div>

              <div style={{ overflowX: "auto", maxWidth: "100%", marginTop: 30 }}>
                <h3 style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                  Historical Comparison (Sample Data)
                </h3>
                <table style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  background: "#fff",
                  borderRadius: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}>
                  <thead>
                    <tr style={{
                      background: "#f4f6fa",
                      fontWeight: 600,
                      textAlign: 'left'
                    }}>
                      <th style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}>
                        Period
                      </th>
                      <th style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}>
                        Step
                      </th>
                      <th style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}>
                        Drop-off (%)
                      </th>
                      <th style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}>
                        Sentiment
                      </th>
                      <th style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}>
                        Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: '1px solid #eee' }}>
                      <td style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}>
                        2025-07-21
                      </td>
                      <td style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                        Email Verification
                      </td>
                      <td style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                        38% → 32%
                      </td>
                      <td>😃↗️</td>
                      <td style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                        Add real-time email verification status
                      </td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #eee' }}>
                      <td style={{
                        padding: "12px 16px",
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}>
                        2025-07-28
                      </td>
                      <td style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                        Profile Completion
                      </td>
                      <td style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                        55% → 40%
                      </td>
                      <td>😶→😃</td>
                      <td style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                        Reduce required fields, add progress indicator
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "Settings" && (
            <div style={{ maxWidth: 650 }}>
              <h2 style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                Settings
              </h2>
              <p style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                Manage your configuration, API keys, and application preferences.
              </p>

              {/* Polished Settings Card */}
              <div style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "32px",
                  margin: "20px 0",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.06)"
                }}
              >
                {/* Section 1: API Configuration */}
                <div>
                  <h4 style={{marginTop: 0, fontFamily: "'DM Sans', Arial, sans-serif", borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '20px'}}>API Configuration</h4>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '8px',
                      fontFamily: "'DM Sans', Arial, sans-serif"
                    }}>
                      Hugging Face API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Enter your API key..."
                      style={{
                        width: '100%',
                        padding: 12,
                        marginTop: 6,
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        fontFamily: "'DM Sans', Arial, sans-serif",
                        fontSize: '1rem'
                      }}
                      defaultValue={process.env.REACT_APP_HF_API_KEY ? "••••••••••••••••" : ""}
                    />
                  </div>
                </div>

                {/* Section 2: Alert Thresholds */}
                <div style={{marginTop: '32px'}}>
                   <h4 style={{marginTop: 0, fontFamily: "'DM Sans', Arial, sans-serif", borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '20px'}}>Alert Thresholds</h4>
                   <p style={{fontSize: '14px', color: '#666', marginTop: '-10px', marginBottom: '24px', fontFamily: "'DM Sans', Arial, sans-serif"}}>Control the sensitivity of the AI Agent's status alerts for live data.</p>
                  
                   <div style={{ marginBottom: 24 }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                        <label style={{ fontWeight: 600, fontFamily: "'DM Sans', Arial, sans-serif" }}>
                          Investigating Threshold
                        </label>
                        <span style={{fontFamily: "'DM Sans', Arial, sans-serif", background: '#eef2f9', padding: '4px 8px', borderRadius: '6px', fontSize: '14px', fontWeight: '600'}}>{investigatingThreshold}%</span>
                      </div>
                      <input type="range" min="1" max="50" value={investigatingThreshold} onChange={e => setInvestigatingThreshold(Number(e.target.value))} style={{width: '100%'}} />
                      <p style={{fontSize: '13px', color: '#777', margin: '8px 0 0 0', fontFamily: "'DM Sans', Arial, sans-serif"}}>Triggers an 'Investigating' status when a drop-off spike exceeds this percentage.</p>
                   </div>
                  
                   <div style={{ marginBottom: 24 }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                        <label style={{ fontWeight: 600, fontFamily: "'DM Sans', Arial, sans-serif" }}>
                          Action Threshold
                        </label>
                        <span style={{fontFamily: "'DM Sans', Arial, sans-serif", background: '#eef2f9', padding: '4px 8px', borderRadius: '6px', fontSize: '14px', fontWeight: '600'}}>{actionThreshold}%</span>
                      </div>
                      <input type="range" min="1" max="50" value={actionThreshold} onChange={e => setActionThreshold(Number(e.target.value))} style={{width: '100%'}} />
                      <p style={{fontSize: '13px', color: '#777', margin: '8px 0 0 0', fontFamily: "'DM Sans', Arial, sans-serif"}}>Triggers an 'Action Required' status for critical drop-off spikes.</p>
                   </div>
                </div>
                
                 {/* Section 3: General Preferences */}
                 <div style={{marginTop: '32px'}}>
                    <h4 style={{marginTop: 0, fontFamily: "'DM Sans', Arial, sans-serif", borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '20px'}}>General Preferences</h4>
                     <div style={{ marginBottom: 18 }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontFamily: "'DM Sans', Arial, sans-serif",
                          fontWeight: 500
                        }}>
                          <input type="checkbox" defaultChecked={true} style={{width: '16px', height: '16px'}} />
                          Enable live data feed
                        </label>
                    </div>
                </div>

                <button
                  type="submit"
                  onClick={() => alert("Settings updated!")}
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '24px',
                    fontFamily: "'DM Sans', Arial, sans-serif",
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  💾 Save Settings
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", margin: "40px 0" }}>
            <FileDropUpload onFile={handleFileUpload} />
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  style={{
                    padding: "10px 18px",
                    borderRadius: 6,
                    background: "#5c6bc0",
                    color: "#fff",
                    border: "none",
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', Arial, sans-serif"
                  }}
                  onClick={downloadSampleJSON}
                >
                  Download Sample Data (.json)
                </button>

                {fileName && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      color: "#1976d2",
                      fontFamily: "'DM Sans', Arial, sans-serif"
                    }}>
                      ✅ {fileName}
                    </span>
                    <button
                      style={{
                        marginLeft: 18,
                        background: "#e0e5ee",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', Arial, sans-serif"
                      }}
                      onClick={() => {
                        setDisplayData(null);
                        setAnalysis(null);
                        setFileName("");
                        localStorage.removeItem('dashboard_analyticsData');
                        setView("live");
                      }}
                    >
                      🗑️ Clear Data
                    </button>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}