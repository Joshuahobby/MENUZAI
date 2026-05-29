import { Composition } from "remotion";
import { MainVideo } from "./compositions/MainVideo";
import { FRAMES } from "./constants";

export function RemotionRoot() {
  return (
    <Composition
      id="MainVideo"
      component={MainVideo}
      durationInFrames={FRAMES.TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
