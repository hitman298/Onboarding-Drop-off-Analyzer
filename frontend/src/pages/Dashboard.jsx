import { useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { fetchDropoffAnalysis } from "../api/backendAdapter";
import FunnelChart from "../components/FunnelChart";
import InsightsCards from "../components/InsightsCards";

export default function Dashboard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const sampleData = {
    funnel: [
      { step: "Create Account", users: 100 },
      { step: "Verify Email", users: 62 },
      { step: "Finish Profile", users: 28 },
    ],
    user_sessions: [
      "User1: stuck on email verification",
      "User2: abandoned profile setup"
    ]
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const data = await fetchDropoffAnalysis(sampleData);
      setResult(data);
    } catch (err) {
      alert("API error! Make sure Flask backend is running.");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", py: 5 }}>
      <Box sx={{ maxWidth: 600, mx: "auto", bgcolor: "#fff", borderRadius: 3, p: 3, boxShadow: 3 }}>
        <Typography variant="h4" color="primary" fontWeight={700} mb={2}>
          Onboarding Drop-Off Analyzer
        </Typography>
        <Button
          onClick={analyze}
          disabled={loading}
          variant="contained"
          color="primary"
          sx={{ mb: 4 }}
        >
          {loading ? "Analyzing..." : "Analyze Drop-Off"}
        </Button>
        {result && (
          <>
            <FunnelChart funnel={result.funnel} />
            <InsightsCards insights={result.insights} recommendations={result.recommendations} />
          </>
        )}
      </Box>
    </Box>
  );
}
