import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.tsx"),
            name: "BrandiconsReact",
            formats: ["es", "cjs"],
            fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
        },
        rollupOptions: {
            external: ["react", "react/jsx-runtime"],
            output: {
                globals: { react: "React", "react/jsx-runtime": "jsxRuntime" },
            },
        },
        sourcemap: true,
    },
});
