import { useLmStudio } from "../context/LmStudioContext";

function LmStudioStatus() {
  const {
    lmStudioStatus,
    checkLmStudioConnection,
    selectedModel,
    selectModel,
  } = useLmStudio();

  const handleModelChange = (e) => {
    selectModel(e.target.value);
  };

  return (
    <>
      <div className="lm-studio-status">
        <div className="status-indicator">
          <span>LM Studio Status: </span>
          <span
            className={`status-badge ${
              lmStudioStatus.checking
                ? "checking"
                : lmStudioStatus.connected
                ? "connected"
                : "disconnected"
            }`}
          >
            {lmStudioStatus.checking
              ? "Checking..."
              : lmStudioStatus.connected
              ? "Connected"
              : "Disconnected"}
          </span>
          <button
            className="refresh-button"
            onClick={checkLmStudioConnection}
            disabled={lmStudioStatus.checking}
          >
            ↻
          </button>
        </div>
        {lmStudioStatus.error && (
          <div className="status-error">Error: {lmStudioStatus.error}</div>
        )}
        {lmStudioStatus.connected && lmStudioStatus.models && (
          <div className="status-models">
            Models: {lmStudioStatus.models.length} available
          </div>
        )}
      </div>

      {lmStudioStatus.connected &&
        lmStudioStatus.models &&
        lmStudioStatus.models.length > 0 && (
          <div className="model-selector-container">
            <label htmlFor="model-selector">Select Model:</label>
            <select
              id="model-selector"
              value={selectedModel || ""}
              onChange={handleModelChange}
              disabled={false}
            >
              <option value="" disabled>
                Select a Model
              </option>
              {lmStudioStatus.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </div>
        )}
    </>
  );
}

export default LmStudioStatus;
