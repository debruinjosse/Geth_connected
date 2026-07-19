import { BrandLogo } from "@/components/BrandLogo";
import { GoldenLeaves } from "@/components/GoldenLeaves";

export function LoadingScreen() {
  return (
    <main className="loading-screen">
      <GoldenLeaves className="loading-leaves left" />
      <GoldenLeaves className="loading-leaves right" mirrored />
      <div className="loading-panel">
        <BrandLogo />
        <div className="loading-status">
          <p>Preparing your recognition experience</p>
          <div className="loading-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </main>
  );
}
