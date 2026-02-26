import React, { useEffect, useState } from "react";
import API from "../api";

export default function ResultsTable() {
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  async function loadResults() {
    try {
      const res = await API.get("/results/");
      setRows(res.data);
    } catch (err) {
      console.log(err);
      alert("Failed to load results");
    }
  }

  async function handleDelete(id) {
    try {
      await API.delete(`/results/${id}`);
      alert("Deleted Successfully!");
      loadResults();
    } catch (err) {
      console.log(err);
      alert("Failed to delete");
    }
  }

  function safeParseExplainable(row) {
    // ✅ if backend already returns explainable_ai as object
    if (row?.explainable_ai && typeof row.explainable_ai === "object") {
      return row.explainable_ai;
    }

    // ✅ if backend returns explainable_output as string
    const raw = row?.explainable_output;

    if (!raw || typeof raw !== "string") return null;

    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>Evaluation History</h2>

        {rows.length === 0 ? (
          <p>No results yet.</p>
        ) : (
          <table border="1" cellPadding="10" width="100%">
            <thead>
              <tr>
                <th>ID</th>
                <th>Score</th>
                <th>OCR Engine</th>
                <th>Language</th>
                <th>Feedback</th>
                <th>Extracted Text</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.score}</td>
                  <td>{r.ocr_engine}</td>
                  <td>{r.language}</td>
                  <td>{r.feedback}</td>
                  <td style={{ maxWidth: "350px" }}>{r.extracted_text}</td>
                  <td>
                    <button
                      onClick={() => setSelectedRow(r)}
                      style={{
                        background: "#2563eb",
                        color: "white",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "10px"
                      }}
                    >
                      View
                    </button>

                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        background: "red",
                        color: "white",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <br />
        <button onClick={loadResults}>Refresh</button>
      </div>

      {/* ✅ VIEW MODAL */}
      {selectedRow && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              width: "80%",
              maxWidth: "900px",
              maxHeight: "80%",
              overflowY: "auto"
            }}
          >
            <h2>Result Details (ID: {selectedRow.id})</h2>

            <p>
              <b>Score:</b> {selectedRow.score}
            </p>
            <p>
              <b>Feedback:</b> {selectedRow.feedback}
            </p>

            <hr />

            <h3>Explainable AI</h3>

            {(() => {
              const exp = safeParseExplainable(selectedRow);

              if (!exp) {
                return (
                  <p style={{ color: "gray" }}>
                    Not available for this old result. (Evaluate again to generate explainable output.)
                  </p>
                );
              }

              return (
                <div>
                  <p><b>Similarity:</b> {exp.similarity}</p>
                  <p><b>Length Ratio:</b> {exp.length_ratio}</p>

                  <p><b>Explanation:</b></p>
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "10px"
                    }}
                  >
                    {exp.explanation}
                  </div>

                  {exp.matched?.length > 0 && (
                    <>
                      <p><b>Matched Points:</b></p>
                      <ul>
                        {exp.matched.map((m, i) => (
                          <li key={i}>
                            <b>{m.similarity}</b> → {m.model_sentence}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {exp.missing?.length > 0 && (
                    <>
                      <p><b>Missing Points:</b></p>
                      <ul>
                        {exp.missing.map((ms, i) => (
                          <li key={i}>{ms}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              );
            })()}

            <hr />

            <h3>Extracted Text</h3>
            <div
              style={{
                background: "#f9fafb",
                padding: "12px",
                borderRadius: "8px"
              }}
            >
              {selectedRow.extracted_text}
            </div>

            <br />
            <button
              onClick={() => setSelectedRow(null)}
              style={{
                background: "#111827",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
