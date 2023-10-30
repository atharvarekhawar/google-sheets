/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderColor: {
        gray: "#C4C7C5",
        blue: "#1973E8",
        "dark-blue": "#0b57d0",
        "light-gray": "#D5D5D5",
        "mild-gray": "#d9d9d9",
      },
      outlineColor: {
        "light-blue": "#a8c7fa",
        "dark-blue": "#0b57d0",
      },
      backgroundColor: {
        "dark-silver": "#C0C0C0",
        "dark-blue": "#0b57d0",
        "light-blue": "#D3E3FD",
        blue: "#4589eb",
        "light-green": "#C7EED1",
        "dark-green": "#79D28F",
        "light-sky-blue": "rgb(14, 101, 235, 0.1)",
      },
      textColor: {
        "light-gray": "#575a5a",
        "dark-gray": "#444746",
      },
      fontFamily: {
        medium: "Open-Sans-Medium",
        bold: "Open-Sans-Bold",
        semibold: "Open-Sans-SemiBold",
        light: "Open-Sans-Light",
        regular: "Open-Sans",
      },
    },
  },
  plugins: [],
};
