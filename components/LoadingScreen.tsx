import { BrandLogo } from "@/components/BrandLogo";

export function LoadingScreen() {
  return (
    <main className="loading-screen">
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
