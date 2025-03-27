import { useState } from "react";
import { useSubtitle } from "../context/SubtitleContext";

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

  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "tr", name: "Turkish" },
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
      // In a real implementation, this would call an API
      // For this demo, we'll simulate translation
      return batch.map((subtitle) => {
        // Simulate translation by reversing the text (just for demo)
        return {
          ...subtitle,
          translated: `[${targetLanguage}] ${subtitle.text
            .split("")
            .reverse()
            .join("")}`,
        };
      });
    } catch (error) {
      throw new Error(`Translation failed: ${error.message}`);
    }
  };

  const startTranslation = async () => {
    if (!targetLanguage || !subtitles.length) {
      setError("Please select a language and make sure subtitles are loaded");
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
        disabled={translationInProgress || !targetLanguage || !subtitles.length}
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
