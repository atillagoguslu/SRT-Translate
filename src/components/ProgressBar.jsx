function ProgressBar({ progress, timeRemaining }) {
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">{progress}%</span>
      </div>
      <div className="time-remaining">
        Time remaining: {formatTime(timeRemaining)}
      </div>
    </>
  );
}

export default ProgressBar;
