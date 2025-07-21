// src/components/AgentStatusBadge.js
import React from 'react';

const AgentStatusBadge = ({ status }) => {
  const config = {
    watching: { label: "Watching", color: "#1e2532", bg: "#e0e0e0" },
    investigating: { label: "Investigating", color: "#1e2532", bg: "#ffc107" }, // WCAG compliant amber
    action: { label: "Action Required", color: "#fff", bg: "#d32f2f" }, // Darker red for contrast
  };
  const current = config[status] || config.watching;
  const ariaText = `Agent status: ${current.label}`;

  return (
    <div
      aria-label={ariaText}
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: "'DM Sans', Arial, sans-serif",
        fontWeight: 700,
        marginBottom: '12px'
    }}>
      <span style={{
        background: current.bg,
        color: current.color,
        borderRadius: "10px",
        padding: "5px 12px",
        fontSize: "0.95em",
        transition: 'background 0.3s ease',
      }}>
        {current.label}
      </span>
    </div>
  );
};

export default AgentStatusBadge;