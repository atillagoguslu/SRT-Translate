import { useState } from "react";
import { useSubtitle } from "../context/SubtitleContext";
import Parser from "srt-parser-2";

function ExportOptions() {
  const { subtitles, generateSRT } = useSubtitle();
  const [filename, setFilename] = useState("translated_subtitles.srt");
  const [encoding, setEncoding] = useState("UTF-8");

  const encodingOptions = ["UTF-8", "ISO-8859-1", "Windows-1252"];

  const handleFilenameChange = (e) => {
    let value = e.target.value;
    if (!value.endsWith(".srt")) {
      value += ".srt";
    }
    setFilename(value);
  };

  const handleEncodingChange = (e) => {
    setEncoding(e.target.value);
  };

  const handleExport = () => {
    // Check if we have subtitles to export
    if (!subtitles.length) {
      return;
    }

    // Generate SRT content using the library
    const parser = new Parser();
    const srtData = subtitles.map((sub) => ({
      id: sub.id.toString(),
      startTime: sub.startTime,
      endTime: sub.endTime,
      text: sub.translated || sub.text,
    }));

    const content = parser.toSrt(srtData);

    // Create a blob with the specified encoding
    const blob = new Blob([content], {
      type: `text/plain;charset=${encoding.toLowerCase()}`,
    });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    // Trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="export-options">
      <div className="export-row">
        <div className="filename-input">
          <label htmlFor="filename">Filename:</label>
          <input
            type="text"
            id="filename"
            value={filename}
            onChange={handleFilenameChange}
            placeholder="translated_subtitles.srt"
          />
        </div>

        <div className="encoding-selector">
          <label htmlFor="encoding">Encoding:</label>
          <select
            id="encoding"
            value={encoding}
            onChange={handleEncodingChange}
          >
            {encodingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="export-button"
        onClick={handleExport}
        disabled={!subtitles.length}
      >
        Export SRT File
      </button>
    </div>
  );
}

export default ExportOptions;
