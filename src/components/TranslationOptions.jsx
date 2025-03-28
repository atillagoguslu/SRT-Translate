import { useState, useEffect } from "react";
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
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(subtitles.length || 0);
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(500);
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Update endIndex when subtitles change
  useEffect(() => {
    setEndIndex(subtitles.length);
  }, [subtitles.length]);

  // Update time remaining during translation
  useEffect(() => {
    let timer;
    if (translationInProgress && startTime && progress > 0) {
      timer = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const estimatedTotalSeconds = (elapsedSeconds / progress) * 100;
        const remainingSeconds = Math.max(
          0,
          estimatedTotalSeconds - elapsedSeconds
        );

        setTimeRemaining(remainingSeconds);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [translationInProgress, startTime, progress]);

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
      // Just translate the full sentence without line break instructions
      const fullTranslatedText = await lmStudioService.translateText(
        sentenceGroup.fullText,
        getLanguageName(targetLanguage),
        selectedModel,
        temperature,
        maxTokens
      );

      // Clean the translated text
      const cleanTranslatedText = fullTranslatedText.replace(/•/g, "").trim();

      // Handle single subtitle case directly
      if (sentenceGroup.subtitles.length === 1) {
        return [
          {
            ...sentenceGroup.subtitles[0],
            translated: cleanTranslatedText || "[Error: Missing translation]",
          },
        ];
      }

      // Use intelligent splitting based on original line structure and content
      const translatedLines = intelligentlySplitText(
        cleanTranslatedText,
        sentenceGroup.subtitles
      );

      // Map translated lines to subtitle objects
      return sentenceGroup.subtitles.map((subtitle, index) => ({
        ...subtitle,
        translated: translatedLines[index] || "[Error: Missing translation]",
      }));
    } catch (error) {
      throw new Error(`Translation failed: ${error.message}`);
    }
  };

  // Intelligently split text based on original subtitle structure
  const intelligentlySplitText = (translatedText, originalSubtitles) => {
    const lineCount = originalSubtitles.length;
    if (lineCount === 1) return [translatedText];

    // Analyze original subtitle characteristics
    const originalLengthRatios = [];
    const totalOriginalLength = originalSubtitles.reduce(
      (sum, sub) => sum + sub.text.length,
      0
    );

    // Calculate what percentage of the total text each subtitle represents
    for (const sub of originalSubtitles) {
      originalLengthRatios.push(sub.text.length / totalOriginalLength);
    }

    // Get punctuation break points
    const breakPoints = [];
    const punctuationPattern = /[,.!?:;]\s+/g;
    let match;

    while ((match = punctuationPattern.exec(translatedText)) !== null) {
      breakPoints.push({
        index: match.index + 1, // +1 to include the punctuation
        char: translatedText[match.index],
      });
    }

    // First try to split at sentence endings for clean breaks
    if (
      breakPoints.filter((bp) => ".!?".includes(bp.char)).length >=
      lineCount - 1
    ) {
      // We have enough sentence-ending punctuation
      return splitAtPunctuation(
        translatedText,
        lineCount,
        breakPoints,
        originalLengthRatios,
        true
      );
    }
    // Then try with all punctuation marks
    else if (breakPoints.length >= lineCount - 1) {
      return splitAtPunctuation(
        translatedText,
        lineCount,
        breakPoints,
        originalLengthRatios,
        false
      );
    }
    // Finally fall back to proportional splitting
    else {
      return splitByProportion(translatedText, originalLengthRatios);
    }
  };

  // Split text at punctuation marks, trying to maintain original proportions
  const splitAtPunctuation = (
    text,
    lineCount,
    breakPoints,
    originalRatios,
    sentenceEndOnly
  ) => {
    // Filter break points if we only want sentence endings
    if (sentenceEndOnly) {
      breakPoints = breakPoints.filter((bp) => ".!?".includes(bp.char));
    }

    breakPoints.sort((a, b) => a.index - b.index);

    // Calculate ideal break positions based on original ratios
    const idealPositions = [];
    let cumulativeRatio = 0;

    for (let i = 0; i < originalRatios.length - 1; i++) {
      cumulativeRatio += originalRatios[i];
      idealPositions.push(Math.round(text.length * cumulativeRatio));
    }

    // Find closest break points to ideal positions
    const selectedBreakPoints = [];
    for (const idealPos of idealPositions) {
      if (breakPoints.length === 0) break;

      // Find closest break point
      let closestPoint = breakPoints.reduce((prev, curr) =>
        Math.abs(curr.index - idealPos) < Math.abs(prev.index - idealPos)
          ? curr
          : prev
      );

      selectedBreakPoints.push(closestPoint.index);

      // Remove used break point and nearby points to avoid clustering
      breakPoints = breakPoints.filter(
        (bp) => Math.abs(bp.index - closestPoint.index) > 10
      );
    }

    // Sort break points
    selectedBreakPoints.sort((a, b) => a - b);

    // Split text at the selected points
    return splitAtIndices(text, selectedBreakPoints);
  };

  // Split text proportionally according to original subtitle length ratios
  const splitByProportion = (text, ratios) => {
    const breakPoints = [];
    let cumulativeRatio = 0;

    // Calculate break points based on original proportions
    for (let i = 0; i < ratios.length - 1; i++) {
      cumulativeRatio += ratios[i];

      // Find a good break point near the proportional position
      const idealPos = Math.round(text.length * cumulativeRatio);
      let actualPos = idealPos;

      // Look for a space within 10 characters
      const searchRadius = 15;
      for (let j = 0; j < searchRadius; j++) {
        // Check forward
        if (idealPos + j < text.length && text[idealPos + j] === " ") {
          actualPos = idealPos + j;
          break;
        }
        // Check backward
        if (idealPos - j > 0 && text[idealPos - j] === " ") {
          actualPos = idealPos - j;
          break;
        }
      }

      breakPoints.push(actualPos);
    }

    // Split text at the selected points
    return splitAtIndices(text, breakPoints);
  };

  // Helper to split text at specified indices
  const splitAtIndices = (text, indices) => {
    const lines = [];
    let startIndex = 0;

    for (const index of indices) {
      lines.push(text.substring(startIndex, index).trim());
      startIndex = index;
    }

    lines.push(text.substring(startIndex).trim());
    return lines;
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

    const validatedStart = Math.max(
      0,
      Math.min(startIndex, subtitles.length - 1)
    );
    const validatedEnd = Math.max(
      validatedStart,
      Math.min(endIndex, subtitles.length)
    );

    if (validatedStart >= validatedEnd) {
      setError("Start index must be less than end index");
      return;
    }

    setTranslationInProgress(true);
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setStartTime(Date.now());
    setTimeRemaining(null);

    try {
      // Get subtitles in the specified range
      const subtitlesToTranslate = subtitles.slice(
        validatedStart,
        validatedEnd
      );

      // Group subtitles into sentences
      const sentenceGroups = groupSubtitlesIntoSentences(subtitlesToTranslate);
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
            Math.round((processedSubtitles / subtitlesToTranslate.length) * 100)
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
        <>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
            <span className="progress-text">{progress}%</span>
          </div>
          <div className="time-remaining">
            Time remaining: {formatTime(timeRemaining)}
          </div>
        </>
      )}
    </div>
  );
}

export default TranslationOptions;
