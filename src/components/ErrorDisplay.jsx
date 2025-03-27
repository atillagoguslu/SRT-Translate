import { useSubtitle } from "../context/SubtitleContext";

function ErrorDisplay() {
  const { error, setError } = useSubtitle();

  if (!error) {
    return null;
  }

  return (
    <div className="error-display">
      <div className="error-content">
        <p className="error-message">{error}</p>
        <button className="error-close" onClick={() => setError(null)}>
          ×
        </button>
      </div>
    </div>
  );
}

export default ErrorDisplay;
