import * as mf from "mock-fetch/mod.ts";
import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import FormatLeaderBoard from "./format_leaderboard.ts";

// Replaces global fetch with the mocked copy
mf.install();

mf.mock("POST@/api/apps.datastore.put", () => {
  return new Response(JSON.stringify({ ok: true }));
});

const { createContext } = SlackFunctionTester("log_run");

Deno.test("Confirm team output", async () => {
  const inputs = {
    runner_stats: [{
      runner: "U0123456",
      weekly_distance: 4,
      total_distance: 20,
    }, {
      runner: "U0123456",
      weekly_distance: 6,
      total_distance: 10,
    }],
    team_distance: 4,
    percent_change: 20,
  };

  const { outputs } = await FormatLeaderBoard(createContext({ inputs }));
  assertEquals(
    outputs?.teamStatsFormatted,
    `Your team ran *4 miles* this past week: a 20% difference from the prior week.`,
  );
});

Deno.test("Confirm runner output", async () => {
  const inputs = {
    runner_stats: [{
      runner: "U1",
      weekly_distance: 4,
      total_distance: 20,
    }, {
      runner: "U2",
      weekly_distance: 6,
      total_distance: 10,
    }],
    team_distance: 4,
    percent_change: 20,
  };

  const { outputs } = await FormatLeaderBoard(createContext({ inputs }));
  assertEquals(
    outputs?.runnerStatsFormatted,
    ` - <@U2> ran 6 miles last week (10 total)\n - <@U1> ran 4 miles last week (20 total)`,
  );
});
