// components/FileDropUpload.js
import React, { useRef, useState } from 'react';

export default function FileDropUpload({ onFile }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const validExtensions = ['csv', 'json', 'xlsx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (validExtensions.includes(fileExtension)) {
      onFile(file);
    } else {
      alert('Please upload a CSV, JSON, or XLSX file');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        border: isDragActive ? "2px solid #1976d2" : "2px dashed #1976d2",
        borderRadius: 8,
        padding: 32,
        background: isDragActive ? "#f0f7ff" : "#f8fbff",
        textAlign: "center",
        color: "#1565c0",
        margin: "24px 0",
        fontFamily: "'DM Sans', Arial, sans-serif",
        fontSize: 16,
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.xlsx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      {isDragActive
        ? "Drop your onboarding data file here..."
        : "Drag & drop data (CSV, JSON, XLSX) or click to select"}
    </div>
  );
}
