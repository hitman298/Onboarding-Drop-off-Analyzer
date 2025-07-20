/* ------------------------------------------
 * Onboarding Drop-off Analyzer - Full Code
 * (React 18, Vite/Cra-TS or CRA-JS compatible)
 * FIX APPLIED: Corrected Syntax Error
 * ENHANCEMENT: Persistence, Clear Data, Pro 3D Controls
 * ----------------------------------------- */

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
  FaUpload,
} from "react-icons/fa";

/* ---------------------------
 * Chart.js global register
 * -------------------------- */
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

/* ================================================================
 * Hugging Face API Utility
 * ================================================================ */
async function analyzeSentimentHuggingFace(text) {
  // NOTE: This will now use the environment variable as requested.
  const HUGGING_FACE_API_KEY = process.env.REACT_APP_HF_API_KEY;

  if (!HUGGING_FACE_API_KEY) {
    console.warn("Hugging Face API Key is not set. Falling back to basic sentiment analysis.");
    const s = text.toLowerCase();
    if (["rage", "abandon", "fail", "issue"].some((k) => s.includes(k))) return { label: "🤬 Negative", score: 0.9 };
    if (["happy", "good", "great", "success"].some((k) => s.includes(k))) return { label: "😃 Positive", score: 0.9 };
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
        return { label: "unknown", score: 0.0 };
    }
    
    const result = await response.json();
    const topResult = result[0][0] || result[0]; // Handle nested or flat array structures

    const emojiMap = {
      LABEL_0: "🤬 Negative",
      LABEL_1: "😶 Neutral",
      LABEL_2: "😃 Positive",
      negative: "🤬 Negative", // Some models use lowercase
      neutral: "😶 Neutral",
      positive: "😃 Positive",
    };

    return {
      label: emojiMap[topResult.label.toLowerCase()] || topResult.label,
      score: topResult.score,
    };
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    return { label: "unknown", score: 0.0 };
  }
}


/* ================================================================
 * Data Structure Alignment — core funnel in local state
 * ================================================================ */
const onboardingFunnelTemplate = {
  steps: [
    {
      id: "signup",
      name: "Account Creation",
      users: 1000,
      dropoffRate: 0,
      avgTimeSpent: "2.3m",
      commonIssues: ["form_validation", "email_format"],
    },
    {
      id: "verify_email",
      name: "Email Verification",
      users: 850,
      dropoffRate: 15,
      avgTimeSpent: "5.7m",
      commonIssues: ["email_delay", "spam_folder", "unclear_instructions"],
    },
    {
      id: "profile_setup",
      name: "Profile Completion",
      users: 650,
      dropoffRate: 23.5,
      avgTimeSpent: "8.2m",
      commonIssues: ["too_many_fields", "unclear_value_prop", "technical_issues"],
    },
    {
      id: "first_action",
      name: "First Core Action",
      users: 450,
      dropoffRate: 30.8,
      avgTimeSpent: "12.1m",
      commonIssues: ["feature_confusion", "loading_issues", "lack_of_guidance"],
    },
    {
      id: "activation",
      name: "Full Activation",
      users: 350,
      dropoffRate: 22.2,
      avgTimeSpent: "18.5m",
      commonIssues: ["complexity", "time_to_value", "missing_integrations"],
    },
  ],
  metadata: {
    totalSessions: 1000,
    avgCompletionTime: "46.8m",
    overallConversionRate: 35,
    lastUpdated: new Date().toISOString(),
  },
};

/* ------------------------------------------------
 * FIX: Injected CSS Styles for Layout Correction
 * ----------------------------------------------- */
const FunnelStyles = () => (
  <style>{`
    /* New Title Styles */
    .main-title {
        text-align: center;
        font-size: 2.25rem;
        font-weight: 700;
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

    /* Enhanced Canvas container styling */
    .canvas-container {
      position: relative;
      width: 100%;
      height: 360px;
      overflow: hidden;
      min-height: 0;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); /* Subtle background */
    }

    /* Funnel wrapper improvements */
    .funnel-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 500px;
      contain: layout style;
      border: 1px solid #e0e0e0; /* Visual boundary */
    }

    /* Canvas specific fixes */
    .canvas-container canvas {
      width: 100% !important;
      height: 100% !important;
      max-height: 400px;
      display: block; /* Eliminates inline spacing */
    }

    /* Global fixes */
    * {
      box-sizing: border-box;
    }

    /* Fix for flexbox containers with Canvas */
    .chart-section {
      min-height: 0;
      min-width: 0;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .canvas-container {
        height: 300px; /* Smaller on mobile */
      }
      .funnel-wrapper {
        max-height: 350px;
      }
    }
  `}</style>
);


/* ------------------------------------------------
 * UPGRADED: Interactive 3-D Funnel with Pro Controls
 * ----------------------------------------------- */
const Dynamic3DFunnel = ({ funnelData }) => {
  if (!funnelData || !funnelData.steps || funnelData.steps.length === 0) {
    return (
      <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7', borderRadius: 8 }}>
        <p>No funnel data available</p>
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
      <div style={{ width: '100%', height: 360, background: 'transparent' }}>
        <Canvas camera={{ position: [5, 0, 7.5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[20, 10, 10]} intensity={0.7} />
          <Suspense fallback={null}>
            {funnelData.steps.map((step, i) => {
              const ratio = Math.max(0.25, step.users / maxUsers);
              const width = 4 * ratio;
              const y = startY - i * (SEGMENT_HEIGHT + SEGMENT_SPACING);
              const color = step.dropoffRate > 25 ? '#ff6b6b' : step.dropoffRate > 15 ? '#ffd93d' : '#6bcf7f';
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
                if(e?.target && e.originalEvent) e.target.enablePan = e.originalEvent.ctrlKey || e.originalEvent.metaKey;
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
      <div style={{ fontSize: 13, color: '#888', marginTop: 10, textAlign: 'center' }}>
        Rotate: Drag left/right • Zoom: Scroll • Pan: CTRL + Drag
      </div>
    </>
  );
};


/* ------------------------------------------------
 * Helper Utilities (CSV parsers, download, etc.)
 * ------------------------------------------------ */
const parseCSV = (txt) => {
  const [header, ...rows] = txt.trim().split("\n");
  const keys = header.split(",").map((x) => x.trim());
  return rows.map((r) =>
    r
      .split(",")
      .map((x) => x.trim())
      .reduce((acc, val, i) => ({ ...acc, [keys[i]]: val }), {})
  );
};

/* --------------------------------------------
 * Live demo data generator (auto-refreshing)
 * ------------------------------------------- */
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
      const ses = Array.from({ length: 5 }).map(() => {
        const mood = ["positive", "negative", "neutral"][
          Math.floor(Math.random() * 3)
        ];
        const phrases = {
          positive: ["Great onboarding!", "Smooth experience."],
          negative: ["Stuck on step 2.", "Confusing UI."],
          neutral: ["Browse around.", "Checked docs."],
        };
        return { text: phrases[mood][Math.floor(Math.random() * 2)] };
      });
      const labels = Array.from({ length: 7 }, (_, i) => `${i}h`);
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

/* --------------------------------------------------------
 * WEEKLY ANALYSIS ENGINE — clustering & recommendations
 * ------------------------------------------------------- */
const clusterDropoffReasons = (sessions) => {
  const clusters = {
    technical: { keywords: ["error", "loading", "timeout", "crash", "bug"], sessions: [], impact: 0 },
    ux_confusion: { keywords: ["unclear", "confusing", "dont understand", "where is"], sessions: [], impact: 0 },
    time_pressure: { keywords: ["too long", "takes forever", "impatient", "skip"], sessions: [], impact: 0 },
    value_unclear: { keywords: ["why need", "waste of time", "not relevant"], sessions: [], impact: 0 },
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
  const dict = {
    technical: `Add error tracking & graceful retries for "${step.name}".`,
    ux_confusion: `Insert inline help & tool-tips for "${step.name}".`,
    time_pressure: `Shorten "${step.name}" by deferring non-critical inputs.`,
    value_unclear: `Improve value messaging before "${step.name}".`,
  };
  return dict[c] || `Investigate friction at "${step.name}".`;
};

const calculatePotentialImpact = (drop, users) => Math.round((drop / 100) * users);

const generateRecommendations = (funnel, clusters) => {
  const recs = [];

  if (!funnel || !funnel.steps) return recs;

  funnel.steps.forEach((s) => {
    if (s.dropoffRate > 20) {
      const dom = Object.entries(clusters).sort((a, b) => b[1].impact - a[1].impact)[0]?.[0] || 'ux_confusion';
      recs.push({
        stepId: s.id,
        stepName: s.name,
        severity: s.dropoffRate > 30 ? "high" : "medium",
        issue: dom,
        solution: getSolutionForCluster(dom, s),
        estimatedImpact: calculatePotentialImpact(s.dropoffRate, s.users),
      });
    }
  });

  return recs.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
};

/* ===================================================
 * Simple KPI card (animated counter where relevant)
 * ================================================== */
const KPI = ({ label, value, icon }) => {
  const [disp, setDisp] = useState("0");

  useEffect(() => {
    if (typeof value !== 'number' && !String(value).match(/^\d/)) {
        setDisp(value); // static text
        return;
    }
    const target = parseFloat(String(value).replace(/[,%]/g, "")) || 0;
    const dur = 800;
    const start = performance.now();

    const step = (t) => {
      const prog = Math.min((t - start) / dur, 1);
      const eased = 0.5 - Math.cos(prog * Math.PI) / 2;
      const cur = Math.round(eased * target);
      setDisp(label.includes("Conversion") ? `${cur}%` : cur.toLocaleString());
      if (prog < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [label, value]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 24,
        boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", color: "#777" }}>
        {icon}
        <span style={{ marginLeft: 8 }}>{label}</span>
      </span>
      <span style={{ fontSize: 36, fontWeight: 700, color: "#1e2532" }}>
        {disp}
      </span>
    </div>
  );
};

/* --------------------------------------------
 * 2-D funnel bar chart (horizontal bars)
 * ------------------------------------------- */
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
  const opts = {
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
            const v = ctx.raw;
            const prev = i > 0 ? chartData.datasets[0].data[i - 1] : v;
            const drop = prev ? (((prev - v) / prev) * 100).toFixed(1) : 0;
            return `Users: ${v.toLocaleString()}  (${drop}% drop)`;
          },
        },
      },
    },
    scales: { x: { grid: { display: false } }, y: { grid: { display: false } } },
  };
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, flex: 1, minWidth: 300, position: 'relative', height: '450px' }}>
      <Bar data={chartData} options={opts} />
    </div>
  );
};

/* -------------------------
 * Trend line chart (7 pts)
 * ------------------------ */
const TrendLineChart = ({ data }) => {
  if (!data?.labels?.length) return null;
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Users",
        data: data.data,
        borderColor: "#2196f3",
        tension: 0.3,
        fill: false,
      },
    ],
  };
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 24, flex: 1, minWidth: 300, position: 'relative', height: '400px' }}>
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

/* -------------------------
 * FIXED: Sentiment pie + chips
 * ------------------------ */
const SentimentPanel = ({ data }) => {
  if (!data || data.length === 0) return null;
  // Count sentiments
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
        textAlign: 'center'
      }}>User Feedback Sentiment</h4>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '20px' }}>
        <div style={{ width: 130, height: 130, flexShrink: 0 }}>
          <Pie
            data={chartData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              animation: false
            }}
          />
        </div>
        <ul style={{ margin: 0, fontSize: 13, width: '100%', padding: 0, listStyle: 'none' }}>
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


/* ===========================================
 * MAIN APPLICATION
 * ========================================== */
export default function App() {
  /* ---------------- state ---------------- */
  const [displayData, setDisplay] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [view, setView] = useState("live"); // 'live' or 'uploaded'
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard"); // New state for navigation

  const liveData = useLiveAnalyticsFeed();
  const fileRef = useRef();
  
  const SIDEBAR_SECTIONS = [
      { name: "Dashboard", icon: <FaChartBar /> },
      { name: "Funnels", icon: <FaFunnelDollar /> },
      { name: "Sessions", icon: <FaUserCheck /> },
      { name: "Reports", icon: <FaChartLine /> },
      { name: "Settings", icon: <FaCog /> }
  ];

  /* -------------- handlers -------------- */
  const handleFile = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    const ext = f.name.split(".").pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = async (evt) => {
      let parsed = null;
      try {
        if (ext === "csv") parsed = { funnel: parseCSV(evt.target.result), user_sessions: [] };
        if (ext === "json") parsed = JSON.parse(evt.target.result);
        setDisplay(parsed);
        await runAnalysis(parsed);
        setView("uploaded");
        setActiveSection("Dashboard"); // Switch to dashboard view after upload
      } catch (err) {
        console.error("File parsing error:", err);
        alert("Failed to parse the uploaded file. Please check the format.");
      }
    };
    reader.readAsText(f);
  }, []);

  const runAnalysis = async (data) => {
    if (!data || !data.funnel || !data.funnel.length) {
      setAnalysis(null);
      return;
    }
    setIsLoading(true);

    const feedback = data.user_sessions || [];
    const annotatedFeedback = await Promise.all(
        (feedback || []).map(async (f) => {
            const res = await analyzeSentimentHuggingFace(f.text || f);
            return {
                text: f.text || f,
                sentiment: res.label,
                score: res.score,
            };
        })
    );

    const clusters = clusterDropoffReasons(annotatedFeedback);
    const funnelObj = {
      steps: data.funnel.map((s, i, arr) => ({
        id: `step_${i}`,
        name: s.name || s.step,
        users: Number(s.users),
        dropoffRate:
          i === 0 || !arr[i-1].users ? 0 : ((Number(arr[i-1].users) - Number(s.users)) / Number(arr[i-1].users)) * 100,
      })),
    };
    const biggestDrop = funnelObj.steps.length > 1 ? funnelObj.steps.slice(1).sort((a,b)=>b.dropoffRate-a.dropoffRate)[0] : { name: 'N/A', dropoffRate: 0 };
    setAnalysis({
      insights: [`Biggest drop-off at "${biggestDrop.name}" (${biggestDrop.dropoffRate.toFixed(1)}%).`],
      recommendations: generateRecommendations(funnelObj, clusters),
      sentiment: annotatedFeedback,
    });
    setIsLoading(false);
  };

  /* ----- NEW: Report Download Function ----- */
  const downloadReport = () => {
    if (!displayData || !displayData.funnel) {
        alert("No data available to download.");
        return;
    }
    const funnelSteps = funnelFor3D?.steps || [];
    const recommendations = analysis?.recommendations || [];
    
    // Create a map of recommendations by step name for easy lookup
    const recMap = recommendations.reduce((acc, rec) => {
      acc[rec.stepName] = rec.solution;
      return acc;
    }, {});

    const csvHeader = ["Step", "Users", "Drop-off %", "Recommendation"].join(",");
    const csvRows = funnelSteps.map(step => [
        `"${step.name.replace(/"/g, '""')}"`, // Escape quotes in step name
        step.users,
        step.dropoffRate.toFixed(1),
        `"${(recMap[step.name] || "N/A").replace(/"/g, '""')}"`
    ].join(","));

    const csvContent = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `onboarding-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* -------------- Data Persistence Hooks -------------- */
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
        setDisplay(parsedData);
        runAnalysis(parsedData);
        setFileName("Restored Session");
        setView('uploaded');
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.removeItem('dashboard_analyticsData');
      }
    }
  }, []);


  /* -------------- view switch -------------- */
  useEffect(() => {
    if (view === "live" && liveData) {
      setDisplay(liveData);
      runAnalysis(liveData);
    }
  }, [view, liveData]);


  /* -------------- derived KPIs -------------- */
  const totUsers = displayData?.funnel?.[0]?.users?.toLocaleString() || "0";
  const convRate =
    displayData?.funnel?.length > 1 && displayData?.funnel?.[0]?.users > 0
      ? `${(
          (displayData.funnel[displayData.funnel.length - 1].users /
            displayData.funnel[0].users) *
          100
        ).toFixed(0)}`
      : "N/A";
  const bigDrop =
    analysis?.recommendations?.length > 0
    ? analysis.recommendations[0].stepName
    : "N/A";
    
  const funnelFor3D = displayData?.funnel ? {
      steps: displayData.funnel.map((s, i, arr) => ({
        id: s.id || `step_${i}`,
        name: s.step || s.name || `Step ${i + 1}`,
        users: s.users || s.Count || 0,
        dropoffRate: i === 0 || !arr[i-1].users ? 0 : ((arr[i-1].users - s.users) / arr[i-1].users) * 100,
      }))
  } : null;

  /* -------------- render -------------- */
  return (
    <>
      <FunnelStyles />
      <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fa" }}>
        {/* --- sidebar --- */}
        <aside
          style={{
            background: "#1e2532",
            color: "#fff",
            width: 250,
            padding: "36px 0 30px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
            flexShrink: 0,
          }}
        >
          <div className="sidebar-logo-area" style={{ padding: "0 0 10px 0", textAlign: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "1.5rem", color: "#fff" }}>Analyzer</span>
            <span style={{
              background: "#3a4a6e", 
              color: "#e0e0e0", 
              borderRadius: "10px",
              padding: "4px 10px", 
              fontSize: "0.92em", 
              marginLeft: 8,
              fontWeight: 500
            }}>Insights</span>
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
                 }}
               >
                {section.icon}
                {section.name}
               </button>
            ))}
          </nav>
        </aside>

        {/* --- main content --- */}
        <main style={{ flex: 1, padding: "0 48px 48px", overflowY: 'auto' }}>
            {/* --- Main Header --- */}
            <div>
                <h1 className="main-title">Onboarding Drop-off Analyzer</h1>
                <p className="subtitle">Live drop-off tracking, user sentiment, and actionable onboarding insights</p>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30}}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 24 }}>{activeSection}</h2>
                </div>
                 {/* mode toggle */}
                <div
                    style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 10,
                    background: "#e0e5ee",
                    borderRadius: 8,
                    padding: 8,
                    }}
                >
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
                    }}
                    >
                    Your Data
                    </button>
                </div>
            </div>

            {activeSection === "Dashboard" && (
                <>
                    {/* KPIs */}
                    <div
                        style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                        gap: 30,
                        marginBottom: 40,
                        }}
                    >
                        <KPI label="Total Users" value={totUsers} icon={<FaUsers />} />
                        <KPI label="Conversion Rate" value={convRate} icon={<FaArrowUp />} />
                        <KPI label="Biggest Drop-off" value={bigDrop} icon={<FaExclamationTriangle />} />
                    </div>

                    {/* charts */}
                    <div className="chart-section" style={{ display: "flex", flexWrap: "wrap", gap: 30, marginBottom: 40, minHeight: 0 }}>
                        <OnboardingFunnelChart data={displayData?.funnel} />
                        <div className="funnel-wrapper" style={{
                        background: "#fff", 
                        borderRadius: 8, 
                        padding: 24, 
                        flex: 1, 
                        minWidth: 450,
                        overflow: 'hidden'
                        }}>
                        <h3 style={{ marginTop: 0 }}>Interactive 3-D Funnel</h3>
                        {funnelFor3D ? (
                            <Dynamic3DFunnel funnelData={funnelFor3D} />
                        ) : (
                            <p style={{ textAlign: "center", padding: 40 }}>
                            {view === 'live' ? 'Waiting for live data...' : 'Upload data to see the funnel.'}
                            </p>
                        )}
                        </div>
                    </div>

                    <div className="chart-section" style={{ display: "flex", flexWrap: "wrap", gap: 30, marginBottom: 40, minHeight: 0 }}>
                        <TrendLineChart data={displayData?.trend} />
                        {isLoading ? <p>Analyzing Sentiment...</p> : <SentimentPanel data={analysis?.sentiment} />}
                    </div>

                    {/* insights & recommendations */}
                    {analysis?.recommendations?.length > 0 && (
                        <div style={{ background: "#fff", borderRadius: 8, padding: 30, marginBottom: 40 }}>
                        <h2 style={{ marginTop: 0 }}>AI Insights & Recommendations</h2>
                        <h4 style={{ marginBottom: 6 }}>Insights</h4>
                        <ul>
                            {analysis.insights.map((i, idx) => (
                            <li key={idx}>{i}</li>
                            ))}
                        </ul>
                        <h4 style={{ marginBottom: 6, marginTop: 24 }}>Recommendations</h4>
                        <ul>
                            {analysis.recommendations.map((r, idx) => (
                            <li key={idx}>
                                <strong>{r.stepName}:</strong> {r.solution} (Est. Impact: {r.estimatedImpact} users)
                            </li>
                            ))}
                        </ul>
                        </div>
                    )}
                </>
            )}
            
            {activeSection === "Funnels" && (
                <div className="chart-section" style={{ display: "flex", flexWrap: "wrap", gap: 30}}>
                    <div className="funnel-wrapper" style={{
                        background: "#fff", borderRadius: 8, padding: 24, flex: '1 1 60%', minWidth: 450
                    }}>
                        <h3 style={{ marginTop: 0 }}>Interactive 3-D Funnel</h3>
                        {funnelFor3D ? <Dynamic3DFunnel funnelData={funnelFor3D} /> : <p>No data</p>}
                    </div>
                    <div style={{flex: '1 1 35%', minWidth: 300}}>
                        <OnboardingFunnelChart data={displayData?.funnel} />
                    </div>
                </div>
            )}
            
            {activeSection === "Sessions" && (
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    {isLoading ? <p>Analyzing Sessions...</p> : <SentimentPanel data={analysis?.sentiment} />}
                </div>
            )}

            {activeSection === "Reports" && (
              <div>
                <h2>Download & Compare Reports</h2>
                <p>This section can be used to add report downloading, historical comparisons, and data exporting features.</p>
                {/* Date range selection (optional) */}
                <div style={{ margin: "16px 0" }}>
                  <label>Choose Report Range: </label>
                  <select>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button
                    style={{ marginLeft: 14, padding: "8px 16px", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none", fontWeight: 600, cursor: 'pointer' }}
                    onClick={downloadReport}
                  >
                    Download CSV
                  </button>
                </div>
                {/* Example comparison table */}
                <div style={{ overflowX: "auto", maxWidth: 680, marginTop: 30 }}>
                    <h3>Historical Comparison (Example)</h3>
                  <table style={{ borderCollapse: "collapse", width: "100%", background: "#fff", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <thead>
                      <tr style={{ background: "#f4f6fa", fontWeight: 600, textAlign: 'left' }}>
                        <th style={{ padding: "12px 16px" }}>Period</th>
                        <th style={{ padding: "12px 16px" }}>Step</th>
                        <th style={{ padding: "12px 16px" }}>Drop-off (%)</th>
                        <th style={{ padding: "12px 16px" }}>Sentiment</th>
                        <th style={{ padding: "12px 16px" }}>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{borderTop: '1px solid #eee'}}>
                        <td style={{ padding: "12px 16px" }}>2025-07-13</td>
                        <td>Email Verification</td>
                        <td>38 → 32</td>
                        <td>😃↑</td>
                        <td>Add real-time email tracker</td>
                      </tr>
                      <tr style={{borderTop: '1px solid #eee'}}>
                        <td style={{ padding: "12px 16px" }}>2025-07-20</td>
                        <td>Profile Completion</td>
                        <td>55 → 40</td>
                        <td>😶→😃</td>
                        <td>Reduce required fields, clarify help</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === "Settings" && (
              <div style={{ maxWidth: 520 }}>
                <h2>Settings</h2>
                <p>Manage your configuration, API keys, and other application settings here.</p>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    alert("Settings updated!");
                  }}
                  style={{ background: "#fff", borderRadius: 8, padding: 24, maxWidth: 420, margin: "20px 0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <label style={{fontWeight: 600, display: 'block', marginBottom: '6px'}}>Hugging Face API Key<br />
                      <input 
                        type="password" 
                        placeholder="************" 
                        style={{ width: '100%', padding: 10, marginTop: 6, borderRadius: 6, border: "1px solid #c0c0c0", background: '#f8f8f8' }} 
                        readOnly
                        defaultValue={process.env.REACT_APP_HF_API_KEY ? "**************" : ""}
                      />
                    </label>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <input type="checkbox" checked={true} readOnly disabled /> Enable live data feed
                    </label>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <input type="checkbox" checked={true} readOnly disabled /> Show emoji in sentiment analytics
                    </label>
                  </div>
                  {/* Extend with more preferences as needed */}
                  <button 
                    type="submit" 
                    style={{ background: "#1976d2", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 6, fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}>
                    Save Settings
                  </button>
                </form>
              </div>
            )}


          {/* upload CTA */}
          <div style={{ textAlign: "center", margin: "60px 0" }}>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                padding: "14px 25px",
                fontWeight: 700,
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: 'pointer',
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FaUpload />
              Upload Your Data (.csv, .json)
            </button>
            <input
              type="file"
              accept=".csv,.json"
              ref={fileRef}
              style={{ display: "none" }}
              onChange={handleFile}
            />
            {fileName && (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 10}}>
                <span style={{ color: "#1976d2" }}>✔ {fileName}</span>
                <button
                  style={{ marginLeft: 18, background: "#e0e5ee", border: "none", padding: "8px 16px", borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => {
                    setDisplay(null);
                    setAnalysis(null);
                    setFileName("");
                    localStorage.removeItem('dashboard_analyticsData');
                    // Reset file input to allow re-uploading the same file
                    if (fileRef.current) {
                      fileRef.current.value = "";
                    }
                  }}
                >
                  Clear Data
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
