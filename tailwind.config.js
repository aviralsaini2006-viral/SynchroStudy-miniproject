/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1e3a5f",
        accent: "#2563eb",
      },
    },
  },
  plugins: [],
}
