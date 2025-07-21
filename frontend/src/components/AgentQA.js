// src/components/AgentQA.js
import React, { useState } from 'react';

export default function AgentQA({ funnel, insights }) {
  const [reply, setReply] = useState('');
  const [query, setQuery] = useState('');

  const ask = (q) => {
    setReply(''); // Clear previous reply on new submission
    if (!q) return;

    if (!funnel || funnel.length === 0 || !insights) {
      setReply("I need data to answer. Please upload a file first.");
      return;
    }

    const lowerQ = q.toLowerCase();
    const step = funnel.find(s => s.name && lowerQ.includes(s.name.toLowerCase()));

    if (step) {
      const insight = insights.find(i => i.toLowerCase().includes(step.name.toLowerCase()));
      setReply(insight || `For the "${step.name}" step, the drop-off is ${step.dropoffRate.toFixed(1)}%. I recommend reviewing user feedback for specific friction points.`);
    } else {
      setReply(insights[0] || 'No specific insights found for that query. Try asking about a specific funnel step.');
    }
    setQuery(''); // Clear input after asking
  };

  return (
    <div style={{ marginTop: '16px', fontFamily: "'DM Sans', Arial, sans-serif" }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Ask AI Agent</h4>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about a specific funnel step..."
        aria-label="Ask the AI agent a question about the funnel" // Accessibility
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                ask(e.target.value);
            }
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 6,
          border: '1px solid #ccc',
          fontFamily: 'inherit',
          fontSize: '14px',
        }}
      />
      <p style={{fontSize: '12px', color: '#666', margin: '6px 0 0 2px'}}>
        e.g., "Why the drop at 'Verified Email'?"
      </p>
      {reply && (
        <div style={{
            marginTop: 12,
            padding: '10px',
            background: '#f1f5f9',
            borderRadius: 6,
            color: '#333',
            fontFamily: 'inherit',
            fontSize: '14px',
            borderLeft: '4px solid #1976d2'
        }}>
          <strong>Agent:</strong> {reply}
        </div>
      )}
    </div>
  );
}