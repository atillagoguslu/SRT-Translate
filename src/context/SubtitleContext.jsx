import { createContext, useState, useContext } from "react";
import Parser from "srt-parser-2";

const SubtitleContext = createContext();

export function SubtitleProvider({ children }) {
  const [originalContent, setOriginalContent] = useState("");
  const [subtitles, setSubtitles] = useState([]);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseSRT = (content) => {
    setOriginalContent(content);

    // Use srt-parser-2 to parse the SRT content
    const parser = new Parser();
    const rawParsedSubtitles = parser.fromSrt(content);

    // Map the parsed data to our app's subtitle format
    const parsedSubtitles = rawParsedSubtitles.map((sub) => {
      // Check if sub.text ends with a music symbol
      // or comma or period or question mark or exclamation mark
      const lastChar = sub.text.slice(-1);
      if (
        lastChar === "♪" ||
        lastChar === "♫" ||
        lastChar === "," ||
        lastChar === "." ||
        lastChar === "?" ||
        lastChar === "!"
      ) {
        return {
          id: parseInt(sub.id),
          startTime: sub.startTime,
          endTime: sub.endTime,
          text: sub.text,
          translated: null,
        };
      }
      const comma_added = sub.text + ",";
      return {
        id: parseInt(sub.id),
        startTime: sub.startTime,
        endTime: sub.endTime,
        text: comma_added,
        translated: null,
      };
    });

    setSubtitles(parsedSubtitles);
    return parsedSubtitles;
  };

  const updateSubtitle = (id, updatedText, isTranslated = false) => {
    setSubtitles((prevSubtitles) =>
      prevSubtitles.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              [isTranslated ? "translated" : "text"]: updatedText,
            }
          : sub
      )
    );
  };

  const generateSRT = (useTranslated = true) => {
    return subtitles
      .map((sub) => {
        const text =
          useTranslated && sub.translated ? sub.translated : sub.text;
        return `${sub.id}\n${sub.startTime} --> ${sub.endTime}\n${text}\n`;
      })
      .join("\n");
  };

  const value = {
    originalContent,
    subtitles,
    targetLanguage,
    isLoading,
    error,
    setOriginalContent,
    setSubtitles,
    setTargetLanguage,
    setIsLoading,
    setError,
    parseSRT,
    updateSubtitle,
    generateSRT,
  };

  return (
    <SubtitleContext.Provider value={value}>
      {children}
    </SubtitleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSubtitle() {
  const context = useContext(SubtitleContext);
  if (context === undefined) {
    throw new Error("useSubtitle must be used within a SubtitleProvider");
  }
  return context;
}

export default SubtitleContext;
