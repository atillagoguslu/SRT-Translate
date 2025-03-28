import { createContext, useState, useContext, useEffect } from "react";
import lmStudioService from "../services/lmStudioService";

const LmStudioContext = createContext();

export function LmStudioProvider({ children }) {
  const [lmStudioStatus, setLmStudioStatus] = useState({
    connected: false,
    checking: true,
    error: null,
  });

  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    // Check LM Studio connection when component mounts
    checkLmStudioConnection();

    // // Set up periodic check every 30 seconds
    // const intervalId = setInterval(() => {
    //   checkLmStudioConnection(true);
    // }, 30000);

    // Clean up interval on unmount
    // return () => {
    //   clearInterval(intervalId);
    // };
  }, []);

  const checkLmStudioConnection = async (silent = false) => {
    try {
      if (!silent) {
        setLmStudioStatus((prev) => ({ ...prev, checking: true }));
      }
      const status = await lmStudioService.checkConnection();
      setLmStudioStatus({
        connected: status.connected,
        checking: false,
        error: status.error || null,
        models: status.models,
      });
    } catch (error) {
      setLmStudioStatus({
        connected: false,
        checking: false,
        error: error.message,
      });
    }
  };

  const selectModel = (modelId) => {
    setSelectedModel(modelId);
  };

  const value = {
    lmStudioStatus,
    checkLmStudioConnection,
    selectedModel,
    selectModel,
  };

  return (
    <LmStudioContext.Provider value={value}>
      {children}
    </LmStudioContext.Provider>
  );
}

export function useLmStudio() {
  const context = useContext(LmStudioContext);
  if (context === undefined) {
    throw new Error("useLmStudio must be used within a LmStudioProvider");
  }
  return context;
}

export default LmStudioContext;
