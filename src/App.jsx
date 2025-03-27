import "./App.css";
import { SubtitleProvider } from "./context/SubtitleContext";
import FileUploader from "./components/FileUploader";
import SubtitleDisplay from "./components/SubtitleDisplay";
import TranslationOptions from "./components/TranslationOptions";
import ExportOptions from "./components/ExportOptions";
import Footer from "./components/Footer";
import ErrorDisplay from "./components/ErrorDisplay";

function App() {
  return (
    <SubtitleProvider>
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

        <Footer />
      </div>
    </SubtitleProvider>
  );
}

export default App;
