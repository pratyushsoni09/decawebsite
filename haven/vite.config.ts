import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { enquiryApiPlugin } from "./server/enquiryApi";

export default defineConfig({
  plugins: [react(), enquiryApiPlugin()],
  server: {
    port: 5180,
    // the Unreal and Blender working folders hold files the engines keep locked; never watch them
    watch: { ignored: ["**/unreal/**", "**/blender/out/**", "**/blender/export/**"] },
  },
  preview: { port: 5181 },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: { three: ["three"] } },
    },
  },
});
