import { useState, useEffect } from "react";
import { useSubtitle } from "../../context/SubtitleContext";
import { useLmStudio } from "../../context/LmStudioContext";
import LmStudioStatus from "./LmStudioStatus";
import TranslationSettings from "./TranslationSettings";
import ProgressBar from "./ProgressBar";
import TranslationService from "./TranslationService";

function TranslationOptions() {
  const {
    subtitles,
    targetLanguage,
    setTargetLanguage,
    setIsLoading,
    setError,
    updateSubtitle,
  } = useSubtitle();

  const { lmStudioStatus, selectedModel } = useLmStudio();

  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(subtitles.length || 0);
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(100);
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Update endIndex when subtitles change
  useEffect(() => {
    setEndIndex(subtitles.length);
  }, [subtitles]);

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
    setCurrentLineIndex(validatedStart);

    try {
      // Get subtitles in the specified range
      const subtitlesToTranslate = subtitles.slice(
        validatedStart,
        validatedEnd
      );

      // Group subtitles into sentences
      const sentenceGroups =
        TranslationService.groupSubtitlesIntoSentences(subtitlesToTranslate);
      const totalGroups = sentenceGroups.length;
      let processedSubtitles = 0;

      for (let i = 0; i < totalGroups; i++) {
        const sentenceGroup = sentenceGroups[i];
        const translatedSubtitles = await TranslationService.translateSentence(
          sentenceGroup,
          targetLanguage,
          selectedModel,
          temperature,
          maxTokens
        );

        // Update each subtitle in the group with its translation
        for (const translatedSub of translatedSubtitles) {
          updateSubtitle(translatedSub.id, translatedSub.translated, true);
          processedSubtitles++;
          setCurrentLineIndex(validatedStart + processedSubtitles);
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

  return (
    <div className="translation-options">
      <LmStudioStatus />

      <TranslationSettings
        targetLanguage={targetLanguage}
        setTargetLanguage={setTargetLanguage}
        startIndex={startIndex}
        setStartIndex={setStartIndex}
        endIndex={endIndex}
        setEndIndex={setEndIndex}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        translationInProgress={translationInProgress}
        subtitles={subtitles}
      />

      <button
        className="translate-button"
        onClick={startTranslation}
        disabled={
          translationInProgress ||
          !selectedModel ||
          !targetLanguage ||
          !subtitles.length ||
          !lmStudioStatus.connected
        }
      >
        {translationInProgress ? "Translating..." : "Translate Subtitles"}
      </button>

      {translationInProgress && (
        <ProgressBar
          progress={progress}
          timeRemaining={timeRemaining}
          currentIndex={currentLineIndex}
          totalLines={endIndex}
        />
      )}
    </div>
  );
}

export default TranslationOptions;
