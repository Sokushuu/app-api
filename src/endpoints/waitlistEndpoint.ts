import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";
import { ApiException } from "chanfana";

export class WaitlistEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Waitlist"],
    summary: "Join the waitlist",
    operationId: "join-waitlist",
    request: {
      body: contentJson(
        z.object({
          email: z.string().email("Invalid email format").refine(
            (email) => {
              // Enhanced email validation with TLD check
              const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
              return emailRegex.test(email);
            },
            { message: "Invalid email format" }
          ),
        }),
      ),
    },
    responses: {
      "201": {
        description: "Successfully joined waitlist",
        ...contentJson({
          success: z.boolean(),
          message: z.string(),
        }),
      },
      "400": {
        description: "Invalid email format",
        ...contentJson({
          success: z.boolean(),
          errors: z.array(z.object({
            code: z.number(),
            message: z.string(),
          })),
        }),
      },
      "500": {
        description: "Email already registered or server error",
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
    const data = await this.getValidatedData<typeof this.schema>();
    const { email } = data.body;

    try {
      // Check if email already exists
      const existingEmail = await c.env.DB.prepare(
        "SELECT id FROM waitlist WHERE email = ?"
      ).bind(email).first();

      if (existingEmail) {
        throw new ApiException("Email already registered");
      }

      // Insert new email into waitlist
      await c.env.DB.prepare(
        "INSERT INTO waitlist (email) VALUES (?)"
      ).bind(email).run();

      return c.json({
        success: true,
        message: "Successfully joined waitlist",
      }, 201);

    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      
      // Handle other database errors
      throw new ApiException("Internal Server Error");
    }
  }
}