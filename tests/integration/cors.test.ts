import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("CORS configuration", () => {
  it("should allow localhost origins in development", async () => {
    const response = await SELF.fetch("http://local.test/waitlist/count", {
      method: "GET",
      headers: {
        "Origin": "http://localhost:3000",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  });

  it("should allow sokushuu.de domains", async () => {
    const response = await SELF.fetch("http://local.test/waitlist/count", {
      method: "GET", 
      headers: {
        "Origin": "https://sokushuu.de",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://sokushuu.de");
  });

  it("should allow subdomain.sokushuu.de", async () => {
    const response = await SELF.fetch("http://local.test/waitlist/count", {
      method: "GET",
      headers: {
        "Origin": "https://app.sokushuu.de", 
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.sokushuu.de");
  });

  it("should reject unauthorized origins", async () => {
    const response = await SELF.fetch("http://local.test/waitlist/count", {
      method: "GET",
      headers: {
        "Origin": "https://evil.com",
      },
    });

    expect(response.status).toBe(200); // Request still succeeds
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull(); // But no CORS header
  });

  it("should handle OPTIONS preflight requests", async () => {
    const response = await SELF.fetch("http://local.test/waitlist", {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });
});