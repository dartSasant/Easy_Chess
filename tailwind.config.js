module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
      canvas: "#C8D5C4",
      bar: "#F6F3EC",
      ink: "#2E3B2E",
      accent: "#CBAA6B",
      danger: "#A5382C",
      "square-light": "#F6F3EC",
      "square-dark": "#8AA38A",
    },
    },
  },
  plugins: [],
};
