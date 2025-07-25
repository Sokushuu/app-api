import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";
import { ApiException } from "chanfana";

export class ConfigLaunchDateEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Config"],
    summary: "Get web launch date",
    operationId: "get-launch-date",
    responses: {
      "200": {
        description: "Returns the web launch date",
        ...contentJson({
          success: z.boolean(),
          launch_date: z.string(),
        }),
      },
      "500": {
        description: "Server error",
        ...contentJson({
          success: z.boolean(),
          errors: z.array(z.object({
            code: z.number(),
            message: z.string(),
          })),
        }),
      },
    },
  };

  public async handle(c: AppContext) {
    try {
      const result = await c.env.DB.prepare(
        "SELECT value FROM config WHERE key = ?"
      ).bind("web_launch_date").first();

      if (!result) {
        throw new ApiException("Launch date not configured");
      }

      return c.json({
        success: true,
        launch_date: result.value,
      }, 200);

    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException("Internal Server Error");
    }
  }
}