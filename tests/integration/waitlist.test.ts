import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Waitlist endpoint", () => {

  it("should successfully add email to waitlist", async () => {
    const response = await SELF.fetch("http://local.test/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual({
      success: true,
      message: "Successfully joined waitlist",
    });
  });

  it("should reject invalid email format", async () => {
    const response = await SELF.fetch("http://local.test/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "invalid-email",
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
  });

  it("should reject email without TLD", async () => {
    const response = await SELF.fetch("http://local.test/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example",
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    const email = `duplicate-${Date.now()}@example.com`;
    
    // First request should succeed
    const firstResponse = await SELF.fetch("http://local.test/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    expect(firstResponse.status).toBe(201);

    // Second request should fail
    const secondResponse = await SELF.fetch("http://local.test/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await secondResponse.json();
    // Should reject duplicate email with 500 status (ApiException default)
    expect(secondResponse.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.errors[0].message).toBe("Email already registered");
  });

  it("should require email field", async () => {
    const response = await SELF.fetch("http://local.test/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
  });
});