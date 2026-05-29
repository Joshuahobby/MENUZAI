import { loadFont as loadPlusJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: fontHeadline } = loadPlusJakarta("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

export const { fontFamily: fontBody } = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

