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

  const handleModelChange = (e) => {
    selectModel(e.target.value);
  };

  // Detects if a string ends with a sentence-ending character
  const isSentenceEnd = (text) => {
    return /[.!?♪](\s|$)/.test(text.trim());
  };

  // Group subtitles into complete sentences
  const groupSubtitlesIntoSentences = (subtitles) => {
    const sentenceGroups = [];
    let currentGroup = [];

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i];
      currentGroup.push(subtitle);

      // If this subtitle ends with a sentence-ending character or is the last subtitle,
      // consider the current group as a complete sentence
      if (isSentenceEnd(subtitle.text) || i === subtitles.length - 1) {
        sentenceGroups.push({
          subtitles: [...currentGroup],
          fullText: currentGroup.map((sub) => sub.text).join(" • "),
        });
        currentGroup = [];
      }
    }

    return sentenceGroups;
  };

  // Translate a full sentence and split the result back into subtitle chunks
  const translateSentence = async (sentenceGroup) => {
    try {
      // Translate the full sentence
      const fullTranslatedText = await lmStudioService.translateText(
        sentenceGroup.fullText,
        getLanguageName(targetLanguage),
        selectedModel
      );

      // Remove any "•" characters that might have remained in the translation
      const cleanTranslatedText = fullTranslatedText.replace(/•/g, "");

      // Handle single subtitle case directly
      if (sentenceGroup.subtitles.length === 1) {
        return [
          {
            ...sentenceGroup.subtitles[0],
            translated:
              cleanTranslatedText.trim() || "[Error: Missing translation]",
          },
        ];
      }

      // Better approach for multiple subtitles
      const parts = cleanTranslatedText.split(/\s+/); // Split by spaces

      // Calculate the number of words per subtitle
      const wordsPerSubtitle = Math.floor(
        parts.length / sentenceGroup.subtitles.length
      );

      let translatedSubtitles = [];
      let currentIndex = 0;

      for (let i = 0; i < sentenceGroup.subtitles.length; i++) {
        const subtitle = sentenceGroup.subtitles[i];
        const isLastSubtitle = i === sentenceGroup.subtitles.length - 1;

        // For last subtitle, take all remaining words
        const endIndex = isLastSubtitle
          ? parts.length
          : currentIndex + wordsPerSubtitle;

        // Get words for this subtitle
        const translatedChunk = parts.slice(currentIndex, endIndex).join(" ");

        translatedSubtitles.push({
          ...subtitle,
          translated: translatedChunk.trim() || "[Error: Missing translation]",
        });

        currentIndex = endIndex;
      }

      return translatedSubtitles;
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
      // Group subtitles into sentences
      const sentenceGroups = groupSubtitlesIntoSentences(subtitles);
      const totalGroups = sentenceGroups.length;
      let processedSubtitles = 0;

      for (let i = 0; i < totalGroups; i++) {
        const sentenceGroup = sentenceGroups[i];
        const translatedSubtitles = await translateSentence(sentenceGroup);

        // Update each subtitle in the group with its translation
        for (const translatedSub of translatedSubtitles) {
          updateSubtitle(translatedSub.id, translatedSub.translated, true);
          processedSubtitles++;
          setProgress(
            Math.round((processedSubtitles / subtitles.length) * 100)
          );
        }
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
