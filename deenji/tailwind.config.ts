import type { Config } from "tailwindcss";
import { createGlobPatternsForDependencies } from "@nx/angular/tailwind";
import { join } from "node:path";

export default {
  presets: [require("@spartan-ng/brain/hlm-tailwind-preset")],
  content: [
    join(__dirname, "src/**/!(*.stories|*.spec).{ts,html,md,analog,ag}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FAF6F0",
          100: "#F4EEE1",
          200: "#E9DDC3",
          300: "#DECBA5",
          400: "#D3BA87",
          500: "#C9A96B",
          600: "#B38D41",
          700: "#866A31",
          800: "#5A4721",
          900: "#2D2310",
          950: "#161208",
        },
        secondary: {
          50: "#EBEBEB",
          100: "#D4D4D4",
          200: "#ABABAB",
          300: "#808080",
          400: "#575757",
          500: "#2C2C2C",
          600: "#242424",
          700: "#1A1A1A",
          800: "#121212",
          900: "#080808",
          950: "#050505",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
