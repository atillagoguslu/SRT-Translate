import { useState, useRef } from "react";
import { useSubtitle } from "../context/SubtitleContext";

function FileUploader() {
  const { parseSRT, setError } = useSubtitle();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith(".srt")) {
      setError("Please upload a valid SRT file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsedSubs = parseSRT(content);
        if (parsedSubs.length === 0) {
          setError("No subtitles found in the file");
        }
      } catch (error) {
        setError("Failed to parse SRT file: " + error.message);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file");
    };

    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-uploader">
      <div
        className={`drop-area ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <p>
          Drag & drop your SRT file here
          <br />
          or click to browse
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".srt"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

export default FileUploader;
