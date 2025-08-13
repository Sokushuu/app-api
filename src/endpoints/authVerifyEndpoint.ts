import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";
import { validateEmailWithTypoCheck } from "../validation/email";
import { verifyOTP } from "../utils/otp";

export class AuthVerifyEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Auth"],
    summary: "Verify OTP code for authentication",
    operationId: "auth-verify",
    request: {
      body: contentJson(
        z.object({
          email: z.string().email("Invalid email format"),
          code: z.string().length(6, "OTP code must be exactly 6 digits").regex(/^\d{6}$/, "OTP code must contain only digits"),
        }),
      ),
    },
    responses: {
      "200": {
        description: "OTP verified successfully",
        ...contentJson({
          success: z.boolean(),
          message: z.string(),
        }),
      },
      "400": {
        description: "Invalid OTP or email",
        ...contentJson({
          success: z.boolean(),
          errors: z.array(z.object({
            code: z.number(),
            message: z.string(),
          })),
        }),
      },
      "500": {
        description: "Internal server error",
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
    const { email, code } = data.body;

    // Validate email with comprehensive checks
    const emailValidation = validateEmailWithTypoCheck(email);
    if (!emailValidation.isValid) {
      return c.json({
        success: false,
        errors: [{ code: 2000, message: emailValidation.error || "Invalid email format" }],
      }, 400);
    }

    try {
      // Verify the OTP
      const verificationResult = await verifyOTP(c.env.DB, email, code);
      
      if (verificationResult.valid) {
        return c.json({
          success: true,
          message: "OTP verified successfully",
        }, 200);
      } else {
        return c.json({
          success: false,
          errors: [{ code: 2001, message: verificationResult.error || "Invalid or expired OTP" }],
        }, 400);
      }

    } catch (error) {
      console.error("Auth verify error:", error);
      return c.json({
        success: false,
        errors: [{ code: 2002, message: "Internal Server Error" }],
      }, 500);
    }
  }
}