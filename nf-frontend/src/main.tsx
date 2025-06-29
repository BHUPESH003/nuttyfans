import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "src/index.css";
import App from "src/App";
import "swiper/css";
import "swiper/css/navigation"; // for navigation arrows
import "swiper/css/pagination";
import "swiper/css/scrollbar";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
