import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { tasksRouter } from "./endpoints/tasks/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";
import { WaitlistEndpoint } from "./endpoints/waitlistEndpoint";
import { WaitlistCountEndpoint } from "./endpoints/waitlistCountEndpoint";
import { ConfigLaunchDateEndpoint } from "./endpoints/configLaunchDateEndpoint";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS configuration - environment-based origins
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      // Allow requests without origin (e.g., same-origin, Postman, curl)
      if (!origin) return '*';
      
      // Development: allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
      }
      
      // Production: only allow sokushuu.de domains
      if (origin.endsWith('sokushuu.de') || origin === 'https://sokushuu.de') {
        return origin;
      }
      
      // Reject all other origins by returning null
      return null;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: false,
  });
  
  return corsMiddleware(c, next);
});

app.onError((err, c) => {
  if (err instanceof ApiException) {
    // If it's a Chanfana ApiException, let Chanfana handle the response
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode,
    );
  }

  console.error("Global error handler caught:", err); // Log the error if it's not known

  // For other errors, return a generic 500 response
  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
  schema: {
    info: {
      title: "My Awesome API",
      version: "2.0.0",
      description: "This is the documentation for my awesome API.",
    },
  },
});

// Register Tasks Sub router
openapi.route("/tasks", tasksRouter);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);
openapi.post("/waitlist", WaitlistEndpoint);
openapi.get("/waitlist/count", WaitlistCountEndpoint);
openapi.get("/config/launch-date", ConfigLaunchDateEndpoint);

// Export the Hono app
export default app;
