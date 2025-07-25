import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";
import { ApiException } from "chanfana";

export class WaitlistCountEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Waitlist"],
    summary: "Get waitlist count",
    operationId: "get-waitlist-count",
    responses: {
      "200": {
        description: "Returns the total number of waitlist entries",
        ...contentJson({
          success: z.boolean(),
          count: z.number(),
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
        "SELECT COUNT(*) as count FROM waitlist"
      ).first();

      const count = result?.count || 0;

      return c.json({
        success: true,
        count: count,
      }, 200);

    } catch (error) {
      throw new ApiException("Internal Server Error");
    }
  }
}