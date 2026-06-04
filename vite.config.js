import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If deploying to GitHub Pages under https://USER.github.io/REPO/,
// uncomment the next line and set base to "/REPO/".
// On Vercel/Netlify, leave base as default "/".
export default defineConfig({
  plugins: [react()],
  // base: "/cage-distance-dashboard/",
});
