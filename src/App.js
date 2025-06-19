import "./App.css";
import React, { useState, useReducer, useContext } from "react";
import SlotMachine from "./SlotMachine";

function App() {
  const [count, setCount] = useState(123);

  return (
    <div className="App">
      <SlotMachine />
    </div>
  );
}

export default App;
