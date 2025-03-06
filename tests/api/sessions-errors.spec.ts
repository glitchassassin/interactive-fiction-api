import { expect, test } from "@playwright/test";

// Test suite for session error handling
test.describe("Session API Error Handling", () => {
  test("should return 400 for missing game name", async ({ request }) => {
    const response = await request.post("http://localhost:3000/sessions", {
      data: {}, // Missing gameName
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("should return 404 for non-existent game", async ({ request }) => {
    const response = await request.post("http://localhost:3000/sessions", {
      data: { gameName: "non-existent-game.z5" },
    });

    // This should return a 404 or 500 depending on implementation
    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("should return 400 for missing command", async ({ request }) => {
    // Create a session first
    const createResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );

    const { sessionId } = await createResponse.json();

    // Send a request without a command
    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: {}, // Missing command
      }
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("should handle very long commands", async ({ request }) => {
    // Create a session first
    const createResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );

    const { sessionId } = await createResponse.json();

    // Generate a very long command (1000 characters)
    const longCommand = "a".repeat(1000);

    // Send the long command
    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: longCommand },
      }
    );

    // The API should handle this gracefully (either accept or reject with appropriate status)
    expect(response.status()).toBeLessThan(500); // Should not cause a server error
  });

  test("should handle rapid successive commands", async ({ request }) => {
    // Create a session first
    const createResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );

    const { sessionId } = await createResponse.json();

    // Send multiple commands in rapid succession
    const commands = ["look", "inventory", "north", "south", "east", "west"];
    const promises = commands.map((command) =>
      request.post(`http://localhost:3000/sessions/${sessionId}/command`, {
        data: { command },
      })
    );

    // Wait for all commands to complete
    const responses = await Promise.all(promises);

    // All responses should be successful or have appropriate error codes
    for (const response of responses) {
      expect(response.status()).toBeLessThan(500); // Should not cause a server error
    }
  });

  test("should handle invalid session ID format", async ({ request }) => {
    const invalidSessionId = "not-a-valid-uuid";

    const response = await request.post(
      `http://localhost:3000/sessions/${invalidSessionId}/command`,
      {
        data: { command: "look" },
      }
    );

    // Should return an appropriate error status
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("should handle invalid pagination parameters", async ({ request }) => {
    // Create a session first
    const createResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );

    const { sessionId } = await createResponse.json();

    // Test with negative page number
    const response1 = await request.get(
      `http://localhost:3000/sessions/${sessionId}/transcript?page=-1`
    );

    // Should either default to page 1 or return an error
    expect(response1.status()).toBeLessThan(500);

    // Test with negative limit
    const response2 = await request.get(
      `http://localhost:3000/sessions/${sessionId}/transcript?limit=-10`
    );

    // Should either use a default limit or return an error
    expect(response2.status()).toBeLessThan(500);

    // Test with very large limit
    const response3 = await request.get(
      `http://localhost:3000/sessions/${sessionId}/transcript?limit=1000000`
    );

    // Should either cap the limit or handle it gracefully
    expect(response3.status()).toBeLessThan(500);
  });
});
