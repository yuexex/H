import React from "react";
import D3Chart from "./components/D3Chart.jsx";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>D3.js and React Integration</h1>
      </header>
      <main>
        <D3Chart />
      </main>
    </div>
  );
}

export default App;
