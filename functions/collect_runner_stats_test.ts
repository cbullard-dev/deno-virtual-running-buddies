import * as mf from "mock-fetch/mod.ts";
import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import CollectRunnerStatsFunction from "./collect_runner_stats.ts";

// Replaces global fetch with the mocked copy
mf.install();

const { createContext } = SlackFunctionTester("collect_runner_stats");

Deno.test("Error response if database error", async () => {
  mf.mock("POST@/api/apps.datastore.query", () => {
    return new Response(JSON.stringify({ ok: false, error: "error" }));
  });
  const inputs = {};

  const { error } = await CollectRunnerStatsFunction(
    createContext({ inputs }),
  );
  assertEquals(
    error,
    "Failed to retrieve past runs: error",
  );
});

Deno.test("Return runner stats no runners", async () => {
  mf.mock("POST@/api/apps.datastore.query", () => {
    return new Response(JSON.stringify({
      ok: true,
      datastore: "running_datastore",
      items: [],
    }));
  });
  const inputs = {};

  const { outputs } = await CollectRunnerStatsFunction(
    createContext({ inputs }),
  );
  assertEquals(
    outputs?.runner_stats,
    [],
  );
});

Deno.test("Return runner stats single runner single run", async () => {
  mf.mock("POST@/api/apps.datastore.query", () => {
    return new Response(JSON.stringify({
      ok: true,
      datastore: "running_datastore",
      items: [
        {
          runner: "U1",
          rundate: "2023-05-24",
          distance: 2,
          id: "UID2",
        },
      ],
    }));
  });
  const inputs = {};

  const { outputs } = await CollectRunnerStatsFunction(
    createContext({ inputs }),
  );
  assertEquals(
    outputs?.runner_stats,
    [
      { runner: "U1", total_distance: 2, weekly_distance: 0 },
    ],
  );
});

Deno.test("Return runner stats single runner multiple runs", async () => {
  mf.mock("POST@/api/apps.datastore.query", () => {
    return new Response(JSON.stringify({
      ok: true,
      datastore: "running_datastore",
      items: [
        {
          runner: "U1",
          rundate: "2023-05-24",
          distance: 2,
          id: "UID2",
        },
        {
          runner: "U1",
          rundate: "2023-05-23",
          distance: 2,
          id: "UID2",
        },
        {
          runner: "U1",
          rundate: "2023-05-22",
          distance: 2,
          id: "UID2",
        },
      ],
    }));
  });
  const inputs = {};

  const { outputs } = await CollectRunnerStatsFunction(
    createContext({ inputs }),
  );
  assertEquals(
    outputs?.runner_stats,
    [
      { runner: "U1", total_distance: 6, weekly_distance: 0 },
    ],
  );
});

Deno.test("Return runner stats multiple runners single run", async () => {
  mf.mock("POST@/api/apps.datastore.query", () => {
    return new Response(JSON.stringify({
      ok: true,
      datastore: "running_datastore",
      items: [
        {
          runner: "U2",
          rundate: "2023-05-24",
          distance: 1,
          id: "UID1",
        },
        {
          runner: "U1",
          rundate: "2023-05-24",
          distance: 2,
          id: "UID2",
        },
      ],
    }));
  });
  const inputs = {};

  const { outputs } = await CollectRunnerStatsFunction(
    createContext({ inputs }),
  );
  assertEquals(
    outputs?.runner_stats,
    [
      { runner: "U2", total_distance: 1, weekly_distance: 0 },
      { runner: "U1", total_distance: 2, weekly_distance: 0 },
    ],
  );
});

Deno.test("Return runner stats multiple runners multiple runs", async () => {
  mf.mock("POST@/api/apps.datastore.query", () => {
    return new Response(JSON.stringify({
      ok: true,
      datastore: "running_datastore",
      items: [
        {
          runner: "U2",
          rundate: "2023-05-24",
          distance: 1,
          id: "UID1",
        },
        {
          runner: "U1",
          rundate: "2023-05-24",
          distance: 2,
          id: "UID2",
        },
        {
          runner: "U1",
          rundate: "2023-05-24",
          distance: 2,
          id: "UID2",
        },
      ],
    }));
  });
  const inputs = {};

  const { outputs } = await CollectRunnerStatsFunction(
    createContext({ inputs }),
  );
  assertEquals(
    outputs?.runner_stats,
    [
      { runner: "U2", total_distance: 1, weekly_distance: 0 },
      { runner: "U1", total_distance: 4, weekly_distance: 0 },
    ],
  );
});
