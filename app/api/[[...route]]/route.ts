import { Hono } from "hono";
import { handle } from "hono/vercel";

import { HTTPException } from "hono/http-exception";
import parseTask from "./parseTask";
import aiSuggestion from "./aiSuggestion";
import taskBreakdown from "./taskBreakdown";

export const runtime = "edge";

const app = new Hono().basePath("/api");
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({ error: "Internal server error" }, 500);
});

const routes = app.route("/parse", parseTask)
  .route("/taskBreakdown", taskBreakdown)
  .route("/aiSuggestion", aiSuggestion);

export const GET = handle(routes);
export const POST = handle(routes);
export const PATCH = handle(routes);
export const DELETE = handle(routes);

export type ApiRouter = typeof routes;
export type AppType = typeof app;
