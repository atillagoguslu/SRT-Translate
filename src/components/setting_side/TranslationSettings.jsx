
function TranslationSettings({
  targetLanguage,
  setTargetLanguage,
  startIndex,
  setStartIndex,
  endIndex,
  setEndIndex,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  translationInProgress,
  subtitles,
}) {
  const languages = [
    { code: "tr", name: "Turkish" },
    { code: "de", name: "German" },
    { code: "en", name: "English" },
  ];

  const handleLanguageChange = (e) => {
    setTargetLanguage(e.target.value);
  };

  const handleStartIndexChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setStartIndex(Math.max(0, value));
  };

  const handleEndIndexChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setEndIndex(Math.min(value, subtitles.length));
  };

  const handleTemperatureChange = (e) => {
    const value = parseFloat(e.target.value);
    setTemperature(value);
  };

  const handleMaxTokensChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxTokens(value);
  };

  return (
    <>
      <div className="options-row">
        <div className="language-selector">
          <label htmlFor="target-language">Target Language:</label>
          <select
            id="target-language"
            value={targetLanguage}
            onChange={handleLanguageChange}
            disabled={translationInProgress}
          >
            <option value="">Select Language</option>
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="options-row">
        <div className="range-selector">
          <label htmlFor="start-index">Start Index:</label>
          <input
            type="number"
            id="start-index"
            value={startIndex}
            onChange={handleStartIndexChange}
            disabled={translationInProgress}
            min="0"
            max={subtitles.length - 1}
          />
        </div>
        <div className="range-selector">
          <label htmlFor="end-index">End Index:</label>
          <input
            type="number"
            id="end-index"
            value={endIndex}
            onChange={handleEndIndexChange}
            disabled={translationInProgress}
            min={startIndex + 1}
            max={subtitles.length}
          />
        </div>
      </div>

      <div className="options-row">
        <div className="range-selector">
          <label htmlFor="temperature">Temperature:</label>
          <input
            type="range"
            id="temperature"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
            disabled={translationInProgress}
          />
          <span>{temperature}</span>
        </div>
        <div className="range-selector">
          <label htmlFor="max-tokens">Max Tokens:</label>
          <select
            id="max-tokens"
            value={maxTokens}
            onChange={handleMaxTokensChange}
            disabled={translationInProgress}
          >
            <option value="100" defaultValue>
              100
            </option>
            <option value="500">500</option>
            <option value="1000">1000</option>
            <option value="1500">1500</option>
            <option value="2000">2000</option>
            <option value="2500">2500</option>
            <option value="3000">3000</option>
            <option value="3500">3500</option>
            <option value="4000">4000</option>
            <option value="4500">4500</option>
            <option value="5000">5000</option>
            <option value="50000">Limitless</option>
          </select>
        </div>
      </div>
    </>
  );
}

export default TranslationSettings;
