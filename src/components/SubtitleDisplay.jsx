import { useState } from "react";
import { useSubtitle } from "../context/SubtitleContext";

function SubtitleDisplay() {
  const { subtitles, updateSubtitle } = useSubtitle();
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editType, setEditType] = useState("original"); // 'original' or 'translated'

  if (!subtitles.length) {
    return <div className="subtitle-display empty">No subtitles loaded</div>;
  }

  const filteredSubtitles = searchTerm
    ? subtitles.filter(
        (sub) =>
          sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sub.translated &&
            sub.translated.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : subtitles;

  const handleEdit = (id, type) => {
    setEditingId(id);
    setEditType(type);
  };

  const handleSave = (id, e) => {
    const text = e.target.value;
    updateSubtitle(id, text, editType === "translated");
    setEditingId(null);
  };

  const handleKeyDown = (id, e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave(id, e);
    }
    if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <div className="subtitle-display">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search subtitles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="subtitles-container">
        {filteredSubtitles.map((subtitle) => (
          <div key={subtitle.id} className="subtitle-item">
            <div className="subtitle-header">
              <span className="subtitle-id">{subtitle.id}</span>
              <span className="subtitle-time">
                {subtitle.startTime} → {subtitle.endTime}
              </span>
            </div>

            <div className="subtitle-content">
              <div className="original-text">
                {editingId === subtitle.id && editType === "original" ? (
                  <textarea
                    autoFocus
                    defaultValue={subtitle.text}
                    onBlur={(e) => handleSave(subtitle.id, e)}
                    onKeyDown={(e) => handleKeyDown(subtitle.id, e)}
                  />
                ) : (
                  <p onClick={() => handleEdit(subtitle.id, "original")}>
                    {subtitle.text}
                  </p>
                )}
              </div>

              <div className="translated-text">
                {editingId === subtitle.id && editType === "translated" ? (
                  <textarea
                    autoFocus
                    defaultValue={subtitle.translated || ""}
                    onBlur={(e) => handleSave(subtitle.id, e)}
                    onKeyDown={(e) => handleKeyDown(subtitle.id, e)}
                  />
                ) : (
                  <p
                    onClick={() => handleEdit(subtitle.id, "translated")}
                    className={!subtitle.translated ? "empty-translation" : ""}
                  >
                    {subtitle.translated || "Click to add translation"}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubtitleDisplay;
