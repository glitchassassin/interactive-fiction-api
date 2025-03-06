import { expect, test } from "@playwright/test";

// Test suite for session endpoints
test.describe("Session API", () => {
  const gameName = "zork1.z3"; // Using Zork as an example game

  test("should create a new session", async ({ request }) => {
    const response = await request.post("http://localhost:3000/sessions", {
      data: { gameName },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("sessionId");
    expect(body).toHaveProperty("output");
    expect(typeof body.sessionId).toBe("string");
    expect(typeof body.output).toBe("string");
  });

  test("should send a command to a session", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "look" },
      }
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("output");
    expect(typeof body.output).toBe("string");
  });

  test("should handle invalid commands gracefully", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "!@#$%^&*()" },
      }
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("output");
  });

  test("should return 404 for non-existent session", async ({ request }) => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await request.post(
      `http://localhost:3000/sessions/${nonExistentId}/command`,
      {
        data: { command: "look" },
      }
    );

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("not found");
  });

  test("should get transcript for a session", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    // First, send a few commands to build up a transcript
    const commands = ["look", "inventory", "examine me"];

    for (const command of commands) {
      await request.post(
        `http://localhost:3000/sessions/${sessionId}/command`,
        {
          data: { command },
        }
      );
    }

    // Now get the transcript
    const response = await request.get(
      `http://localhost:3000/sessions/${sessionId}/transcript`
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("totalPages");
    expect(body).toHaveProperty("interactions");
    expect(Array.isArray(body.interactions)).toBeTruthy();

    // We should have at least the commands we just sent
    expect(body.interactions.length).toBeGreaterThanOrEqual(commands.length);

    // Check the structure of an interaction
    if (body.interactions.length > 0) {
      const interaction = body.interactions[0];
      expect(interaction).toHaveProperty("command");
      expect(interaction).toHaveProperty("response");
      expect(interaction).toHaveProperty("timestamp");
    }
  });

  test("should paginate transcript results", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    // Get the first page with a small limit
    const response = await request.get(
      `http://localhost:3000/sessions/${sessionId}/transcript?page=1&limit=2`
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("page", 1);
    expect(body.interactions.length).toBeLessThanOrEqual(2);

    // If there are more pages, test the second page
    if (body.totalPages > 1) {
      const page2Response = await request.get(
        `http://localhost:3000/sessions/${sessionId}/transcript?page=2&limit=2`
      );

      expect(page2Response.ok()).toBeTruthy();

      const page2Body = await page2Response.json();
      expect(page2Body).toHaveProperty("page", 2);

      // Ensure we got different interactions
      const page1Commands = body.interactions.map((i: any) => i.command);
      const page2Commands = page2Body.interactions.map((i: any) => i.command);

      // Check if there's at least one different command between pages
      const hasDistinctCommands =
        page1Commands.some((cmd: string) => !page2Commands.includes(cmd)) ||
        page2Commands.some((cmd: string) => !page1Commands.includes(cmd));

      expect(hasDistinctCommands).toBeTruthy();
    }
  });

  test("should return 404 for transcript of non-existent session", async ({
    request,
  }) => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const response = await request.get(
      `http://localhost:3000/sessions/${nonExistentId}/transcript`
    );

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("not found");
  });
});
