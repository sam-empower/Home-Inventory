import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "./lib/serviceWorkerRegistration";

// Register the service worker
registerSW();

createRoot(document.getElementById("root")!).render(<App />);
