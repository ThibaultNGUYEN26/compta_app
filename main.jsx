import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";
import "./components/TransactionForm.css";
import "./components/TransactionList.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
