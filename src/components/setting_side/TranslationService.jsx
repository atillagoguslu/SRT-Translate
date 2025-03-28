import lmStudioService from "../../services/lmStudioService";

// Utility functions for translation processing
const TranslationService = {
  // Detects if a string ends with a sentence-ending character
  isSentenceEnd: (text) => {
    return /[.!?♪](\s|$)/.test(text.trim());
  },

  // Group subtitles into complete sentences
  groupSubtitlesIntoSentences: (subtitles) => {
    const sentenceGroups = [];
    let currentGroup = [];

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i];
      currentGroup.push(subtitle);

      // If this subtitle ends with a sentence-ending character or is the last subtitle,
      // consider the current group as a complete sentence
      if (
        TranslationService.isSentenceEnd(subtitle.text) ||
        i === subtitles.length - 1
      ) {
        sentenceGroups.push({
          subtitles: [...currentGroup],
          fullText: currentGroup.map((sub) => sub.text).join(" • "),
        });
        currentGroup = [];
      }
    }

    return sentenceGroups;
  },

  // Translate a full sentence and split the result back into subtitle chunks
  translateSentence: async (
    sentenceGroup,
    targetLanguage,
    selectedModel,
    temperature,
    maxTokens
  ) => {
    try {
      // Just translate the full sentence without line break instructions
      const fullTranslatedText = await lmStudioService.translateText(
        sentenceGroup.fullText,
        TranslationService.getLanguageName(targetLanguage),
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
      const translatedLines = TranslationService.intelligentlySplitText(
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
  },

  // Intelligently split text based on original subtitle structure
  intelligentlySplitText: (translatedText, originalSubtitles) => {
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

    // Analyze original ending characters
    const originalEndings = originalSubtitles.map((sub) => {
      const trimmed = sub.text.trim();
      return trimmed.length > 0 ? trimmed[trimmed.length - 1] : "";
    });

    // Get all potential break points with their characters
    const allBreakPoints = [];

    // Add quote and comma break points (higher priority)
    const quoteCommaPattern = /[,"]/g;
    let match;
    while ((match = quoteCommaPattern.exec(translatedText)) !== null) {
      allBreakPoints.push({
        index: match.index + 1, // +1 to include the character
        char: translatedText[match.index],
        priority: 3, // Highest priority
      });
    }

    // Add sentence-ending punctuation break points
    const sentenceEndPattern = /[.!?:]/g;
    while ((match = sentenceEndPattern.exec(translatedText)) !== null) {
      allBreakPoints.push({
        index: match.index + 1,
        char: translatedText[match.index],
        priority: 2, // Medium priority
      });
    }

    // Add semicolon break points
    const semicolonPattern = /[;]/g;
    while ((match = semicolonPattern.exec(translatedText)) !== null) {
      allBreakPoints.push({
        index: match.index + 1,
        char: translatedText[match.index],
        priority: 1, // Lower priority
      });
    }

    // Sort break points by index
    allBreakPoints.sort((a, b) => a.index - b.index);

    // Handle special case: if original lines end with quotes or commas, try to match in translation
    if (originalEndings.some((ending) => [",", '"'].includes(ending))) {
      const quoteCommaBreakPoints = allBreakPoints.filter((bp) =>
        [",", '"'].includes(bp.char)
      );

      if (quoteCommaBreakPoints.length >= lineCount - 1) {
        // We have enough quote/comma break points
        return TranslationService.splitAtPunctuationWithEndings(
          translatedText,
          lineCount,
          quoteCommaBreakPoints,
          originalLengthRatios,
          originalEndings
        );
      }
    }

    // First try to split at sentence endings for clean breaks
    const sentenceEndBreakPoints = allBreakPoints.filter((bp) =>
      ".!?".includes(bp.char)
    );
    if (sentenceEndBreakPoints.length >= lineCount - 1) {
      // We have enough sentence-ending punctuation
      return TranslationService.splitAtPunctuation(
        translatedText,
        lineCount,
        sentenceEndBreakPoints,
        originalLengthRatios,
        false
      );
    }
    // Then try with all punctuation marks
    else if (allBreakPoints.length >= lineCount - 1) {
      return TranslationService.splitAtPunctuation(
        translatedText,
        lineCount,
        allBreakPoints,
        originalLengthRatios,
        false
      );
    }
    // Finally fall back to proportional splitting
    else {
      return TranslationService.splitByProportion(
        translatedText,
        originalLengthRatios
      );
    }
  },

  // Special function to match ending characters from original subtitles
  splitAtPunctuationWithEndings: (
    text,
    lineCount,
    breakPoints,
    originalRatios,
    originalEndings
  ) => {
    // Sort break points
    breakPoints.sort((a, b) => a.index - b.index);

    // For each original line ending with , or ", try to find a matching character in translation
    const selectedBreakPoints = [];

    // Calculate ideal break positions based on original ratios
    const idealPositions = [];
    let cumulativeRatio = 0;

    for (let i = 0; i < originalRatios.length - 1; i++) {
      cumulativeRatio += originalRatios[i];
      idealPositions.push({
        position: Math.round(text.length * cumulativeRatio),
        endChar: originalEndings[i],
      });
    }

    // For each ideal position, find the most appropriate break point
    for (let i = 0; i < idealPositions.length; i++) {
      const idealPos = idealPositions[i].position;
      const endChar = idealPositions[i].endChar;

      // If this original line ended with a comma or quote, try to find a matching break
      if ([",", '"'].includes(endChar)) {
        // Find the nearest matching character break
        const matchingBreaks = breakPoints.filter((bp) => bp.char === endChar);

        if (matchingBreaks.length > 0) {
          // Find the closest matching break point
          const closestMatch = matchingBreaks.reduce((prev, curr) =>
            Math.abs(curr.index - idealPos) < Math.abs(prev.index - idealPos)
              ? curr
              : prev
          );

          selectedBreakPoints.push(closestMatch.index);

          // Remove used break point and nearby points to avoid clustering
          breakPoints = breakPoints.filter(
            (bp) => Math.abs(bp.index - closestMatch.index) > 10
          );
          continue;
        }
      }

      // If no matching character or not a comma/quote ending, use standard approach
      if (breakPoints.length > 0) {
        // Find closest break point
        const closestPoint = breakPoints.reduce((prev, curr) =>
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
    }

    // Sort break points
    selectedBreakPoints.sort((a, b) => a - b);

    // Split text at the selected points
    return TranslationService.splitAtIndices(text, selectedBreakPoints);
  },

  // Split text at punctuation marks, trying to maintain original proportions
  splitAtPunctuation: (
    text,
    lineCount,
    breakPoints,
    originalRatios,
    prioritizeSentenceEnd
  ) => {
    // Sort break points by priority if needed
    if (prioritizeSentenceEnd) {
      breakPoints.sort((a, b) => b.priority - a.priority);
    } else {
      breakPoints.sort((a, b) => a.index - b.index);
    }

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
    return TranslationService.splitAtIndices(text, selectedBreakPoints);
  },

  // Split text proportionally according to original subtitle length ratios
  splitByProportion: (text, ratios) => {
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
    return TranslationService.splitAtIndices(text, breakPoints);
  },

  // Helper to split text at specified indices
  splitAtIndices: (text, indices) => {
    const lines = [];
    let startIndex = 0;

    for (const index of indices) {
      lines.push(text.substring(startIndex, index).trim());
      startIndex = index;
    }

    lines.push(text.substring(startIndex).trim());
    return lines;
  },

  getLanguageName: (code) => {
    const languages = [
      { code: "tr", name: "Turkish" },
      { code: "de", name: "German" },
      { code: "en", name: "English" },
    ];
    const language = languages.find((lang) => lang.code === code);
    return language ? language.name : code;
  },
};

export default TranslationService;
