import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LandingPage from "../src/app/page";

describe("public landing page", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("introduces the application and honestly labels unavailable iOS", () => {
    const html = renderToStaticMarkup(createElement(LandingPage));
    expect(html).toContain("English Coach");
    expect(html).toContain("Android");
    expect(html).toContain("iOS");
    expect(html).toContain("قريبًا");
    expect(html).not.toContain('href="#download-ios"');
    expect(html).not.toContain("instant pronunciation feedback");
  });
  it("reflects an available iOS distribution link consistently", () => {
    vi.stubEnv("IOS_DOWNLOAD_URL", "https://testflight.apple.com/join/AbCd1234");
    const html = renderToStaticMarkup(createElement(LandingPage));
    expect(html).toContain('href="https://testflight.apple.com/join/AbCd1234"');
    expect(html).not.toContain("نسخة iOS هتظهر هنا");
    expect(html).not.toContain("قريبًا");
  });
});
