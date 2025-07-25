import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Config endpoints", () => {
  it("should return web launch date", async () => {
    const response = await SELF.fetch("http://local.test/config/launch-date", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.launch_date).toBeDefined();
    expect(typeof data.launch_date).toBe("string");
    
    // Verify it's a valid ISO date string
    const date = new Date(data.launch_date);
    expect(date).toBeInstanceOf(Date);
    expect(isNaN(date.getTime())).toBe(false);
    
    // Verify it's the expected launch date (2025-08-24)
    expect(data.launch_date).toBe("2025-08-24T00:00:00.000Z");
  });

  it("should be accessible without authentication", async () => {
    // This test verifies the endpoint is publicly accessible
    const response = await SELF.fetch("http://local.test/config/launch-date", {
      method: "GET",
      headers: {
        // No authentication headers
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});