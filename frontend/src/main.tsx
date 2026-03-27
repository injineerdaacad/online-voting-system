import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import "./utils/fontawesome";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <App />
);
