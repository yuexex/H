import React, { useState, useEffect } from "react";
import D3Chart from "./components/D3Chart";
import SliderControls from "./components/SliderControls";
import "./App.css";

function App() {
  const [width, setWidth] = useState(window.innerWidth / 2);
  const [height, setHeight] = useState(window.innerHeight / 2);
  const [maxWidth, setMaxWidth] = useState(window.innerWidth);
  const [maxHeight, setMaxHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setMaxWidth(window.innerWidth);
      setMaxHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>D3.js and React Integration</h1>
      </header>
      <main>
        <SliderControls
          width={width}
          height={height}
          onWidthChange={setWidth}
          onHeightChange={setHeight}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
        />
        <D3Chart width={width} height={height} />
      </main>
    </div>
  );
}

export default App;
