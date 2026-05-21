import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DepartmentProvider } from "./context/DepartmentContext";
import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DepartmentProvider>
      <App />
    </DepartmentProvider>
  </React.StrictMode>
);