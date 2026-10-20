// Colors come from CSS variables so the theme can change at runtime.
const c = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: c("canvas"),
        bar: c("bar"),
        ink: c("ink"),
        accent: c("accent"),
        danger: c("danger"),
        "square-light": c("square-light"),
        "square-dark": c("square-dark"),
      },
    },
  },
  plugins: [],
};