import axios from "axios";

const LM_STUDIO_API_URL = "http://localhost:1234/v1"; // Default port for LM Studio

const lmStudioService = {
  // Check if LM Studio API is available
  checkConnection: async () => {
    try {
      // Try multiple endpoints to determine if LM Studio is connected
      // First try models endpoint
      try {
        const response = await axios.get(`${LM_STUDIO_API_URL}/models`);
        if (response.data && response.data.data) {
          return { connected: true, models: response.data.data };
        }
      } catch (error) {
        console.log(
          "Models endpoint check failed, trying health check...",
          error
        );
      }

      // If models endpoint fails, try a basic connection check
      try {
        await axios.get(`${LM_STUDIO_API_URL}`);
        return { connected: true, models: [] };
      } catch (error) {
        console.error("All LM Studio connection checks failed", error);
        return {
          connected: false,
          error: "Could not connect to LM Studio API",
        };
      }
    } catch (error) {
      console.error("Error connecting to LM Studio:", error);
      return { connected: false, error: error.message };
    }
  },

  // Translate text using LM Studio API
  translateText: async (
    text,
    targetLanguage,
    modelId = null,
    temperature = 0.3,
    maxTokens = 100
  ) => {
    try {
      // Check if text starts and ends with music symbols (♪ or ♫) and they are not part of words
      const trimmedText = text.trim();

      // Simple check for any music symbols
      if (/[♪♫]/.test(trimmedText)) {
        return text;
      }

      // eslint-disable-next-line no-unused-vars
      const prompt_backup = `You are a professional translator. Translate the following text into ${targetLanguage}. Only respond with the translated text, nothing else.`;
      const prompt = `You are a professional translator. Translate the following text into ${targetLanguage}. Only respond with the translated text, nothing else.`;

      const response = await axios.post(
        `${LM_STUDIO_API_URL}/chat/completions`,
        {
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: text,
            },
          ],
          model: modelId || "local-model", // Use selected model or default to local-model
          temperature: temperature, // Use the temperature parameter
          max_tokens: maxTokens, // Use the maxTokens parameter
        }
      );

      // Get the translated text
      let translatedText = response.data.choices[0].message.content.trim();

      // Process the translated text to ensure it doesn't split words in the middle
      // This will ensure any hyphenation or word-splitting is fixed
      translatedText = translatedText.replace(/(\w+)-\s+(\w+)/g, "$1$2");

      return translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  },
};

export default lmStudioService;
