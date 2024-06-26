import React from "react";

const Slider = ({ value, onChange }) => {
  return (
    <div>
      <label>Force Strength: {value}</label>
      <input
        type="range"
        min="-1000"
        max="1000"
        step="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};

export default Slider;
