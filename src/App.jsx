import "./App.css";
import { SubtitleProvider } from "./context/SubtitleContext";
import { LmStudioProvider } from "./context/LmStudioContext";
import FileUploader from "./components/FileUploader";
import SubtitleDisplay from "./components/SubtitleDisplay";
import TranslationOptions from "./components/TranslationOptions";
import ExportOptions from "./components/ExportOptions";
import ErrorDisplay from "./components/ErrorDisplay";

function App() {
  return (
    <SubtitleProvider>
      <LmStudioProvider>
        <div className="app-container">
          <header className="app-header">
            <h1>SRTTranslate</h1>
            <p>Easily translate your SRT subtitle files</p>
          </header>

          <main className="app-main">
            <ErrorDisplay />

            <section className="file-upload-section">
              <FileUploader />
            </section>

            <section className="translator-section">
              <div className="options-panel">
                <TranslationOptions />
                <ExportOptions />
              </div>

              <div className="subtitles-panel">
                <SubtitleDisplay />
              </div>
            </section>
          </main>
        </div>
      </LmStudioProvider>
    </SubtitleProvider>
  );
}

export default App;
