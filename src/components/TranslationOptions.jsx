import { useState } from "react";
import { useSubtitle } from "../context/SubtitleContext";
import { useLmStudio } from "../context/LmStudioContext";
import lmStudioService from "../services/lmStudioService";

function TranslationOptions() {
  const {
    subtitles,
    targetLanguage,
    setTargetLanguage,
    setIsLoading,
    setError,
    batchSettings,
    setBatchSettings,
    updateSubtitle,
  } = useSubtitle();

  const {
    lmStudioStatus,
    checkLmStudioConnection,
    selectedModel,
    selectModel,
  } = useLmStudio();

  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const languages = [
    { code: "tr", name: "Turkish" },
    { code: "de", name: "German" },
    { code: "en", name: "English" },
  ];

  const handleLanguageChange = (e) => {
    setTargetLanguage(e.target.value);
  };

  const handleBatchSizeChange = (e) => {
    const { name, value } = e.target;
    setBatchSettings((prev) => ({
      ...prev,
      [name]: parseInt(value, 10),
    }));
  };

  const handleModelChange = (e) => {
    selectModel(e.target.value);
  };

  const createBatches = () => {
    const { minLines, maxLines } = batchSettings;
    const batches = [];
    let currentBatch = [];
    let currentLength = 0;

    subtitles.forEach((subtitle) => {
      currentBatch.push(subtitle);
      currentLength++;

      if (
        currentLength >= maxLines ||
        (currentLength >= minLines && subtitle.text.endsWith("."))
      ) {
        batches.push(currentBatch);
        currentBatch = [];
        currentLength = 0;
      }
    });

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  };

  const translateBatch = async (batch) => {
    try {
      // Get all text from the batch for translation
      const batchText = batch.map((subtitle) => subtitle.text).join("\n");

      // Use LM Studio to translate the batch text
      const translatedText = await lmStudioService.translateText(
        batchText,
        getLanguageName(targetLanguage),
        selectedModel
      );

      // Split the translated text back into individual subtitle translations
      const translatedLines = translatedText.split("\n");

      return batch.map((subtitle, index) => {
        return {
          ...subtitle,
          translated:
            translatedLines[index] ||
            `[Error: Missing translation for line ${index + 1}]`,
        };
      });
    } catch (error) {
      throw new Error(`Translation failed: ${error.message}`);
    }
  };

  const getLanguageName = (code) => {
    const language = languages.find((lang) => lang.code === code);
    return language ? language.name : code;
  };

  const startTranslation = async () => {
    if (!targetLanguage || !subtitles.length) {
      setError("Please select a language and make sure subtitles are loaded");
      return;
    }

    if (!lmStudioStatus.connected) {
      setError(
        "LM Studio is not connected. Please start LM Studio and load a model."
      );
      return;
    }

    setTranslationInProgress(true);
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      const batches = createBatches();
      const totalBatches = batches.length;

      for (let i = 0; i < totalBatches; i++) {
        const batch = batches[i];
        const translatedBatch = await translateBatch(batch);

        // Update each subtitle with its translation
        translatedBatch.forEach((translatedSub) => {
          updateSubtitle(translatedSub.id, translatedSub.translated, true);
        });

        setProgress(Math.round(((i + 1) / totalBatches) * 100));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setTranslationInProgress(false);
      setProgress(100);
    }
  };

  return (
    <div className="translation-options">
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
              disabled={translationInProgress}
            >
              <option value="">Default Model</option>
              {lmStudioStatus.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </div>
        )}

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

        <div className="batch-settings">
          <div className="batch-setting">
            <label htmlFor="minLines">Min Lines:</label>
            <input
              type="number"
              id="minLines"
              name="minLines"
              min="1"
              max="10"
              value={batchSettings.minLines}
              onChange={handleBatchSizeChange}
              disabled={translationInProgress}
            />
          </div>

          <div className="batch-setting">
            <label htmlFor="maxLines">Max Lines:</label>
            <input
              type="number"
              id="maxLines"
              name="maxLines"
              min={batchSettings.minLines}
              max="15"
              value={batchSettings.maxLines}
              onChange={handleBatchSizeChange}
              disabled={translationInProgress}
            />
          </div>
        </div>
      </div>

      <button
        className="translate-button"
        onClick={startTranslation}
        disabled={
          translationInProgress ||
          !targetLanguage ||
          !subtitles.length ||
          !lmStudioStatus.connected
        }
      >
        {translationInProgress ? "Translating..." : "Translate Subtitles"}
      </button>

      {translationInProgress && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
    </div>
  );
}

export default TranslationOptions;
