import { expect, test } from "@playwright/test";

// Test suite for game-specific interactions
test.describe("Game Interactions", () => {
  test("should receive initial game description", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    // Send a 'look' command to get the initial description
    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "look" },
      }
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("output");

    // For Zork, the initial description should mention "West of House"
    expect(body.output).toContain("West of House");
  });

  test("should be able to navigate in the game world", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    // Move north
    const northResponse = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "north" },
      }
    );

    expect(northResponse.ok()).toBeTruthy();
    const body = await northResponse.json();
    expect(body.output).toContain("North of House");
  });

  test("should handle inventory commands", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    // Check inventory
    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "inventory" },
      }
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    // In Zork, the initial inventory response should mention "empty handed" or similar
    expect(body.output.toLowerCase()).toMatch(/empty|nothing|carrying nothing/);
  });

  test("should handle examining objects", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    // Examine self
    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "examine me" },
      }
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.output.length).toBeGreaterThan(0);
  });

  test("should handle taking objects", async ({ request }) => {
    const sessionResponse = await request.post(
      "http://localhost:3000/sessions",
      {
        data: { gameName: "zork1.z3" },
      }
    );
    const sessionId = (await sessionResponse.json()).sessionId;

    // First, go east to find the mailbox
    await request.post(`http://localhost:3000/sessions/${sessionId}/command`, {
      data: { command: "east" },
    });

    // Open the mailbox
    await request.post(`http://localhost:3000/sessions/${sessionId}/command`, {
      data: { command: "open mailbox" },
    });

    // Take the leaflet
    const takeResponse = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "take leaflet" },
      }
    );

    expect(takeResponse.ok()).toBeTruthy();

    // Check inventory to verify we have the leaflet
    const inventoryResponse = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "inventory" },
      }
    );

    const body = await inventoryResponse.json();
    expect(body.output.toLowerCase()).toContain("leaflet");

    const response = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "read leaflet" },
      }
    );

    // Drop the leaflet
    const dropResponse = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "drop leaflet" },
      }
    );

    expect(dropResponse.ok()).toBeTruthy();

    // Check inventory to verify we no longer have the leaflet
    const newInventoryResponse = await request.post(
      `http://localhost:3000/sessions/${sessionId}/command`,
      {
        data: { command: "inventory" },
      }
    );

    const newBody = await newInventoryResponse.json();
    expect(newBody.output.toLowerCase()).not.toContain("leaflet");
  });
});
