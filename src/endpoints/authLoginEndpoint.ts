import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";
import { ApiException } from "chanfana";
import { validateEmailWithTypoCheck } from "../validation/email";
import { createOTP } from "../utils/otp";

interface Smtp2goResponse {
  request_id: string;
  data: {
    succeeded: number;
    failed: number;
    failures: any[];
    email_id: string;
  };
}

export class AuthLoginEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Auth"],
    summary: "Send login email via Smtp2go",
    operationId: "auth-login",
    request: {
      body: contentJson(
        z.object({
          email: z.string().email("Invalid email format"),
        }),
      ),
    },
    responses: {
      "200": {
        description: "OTP generated and email sent successfully",
        ...contentJson({
          success: z.boolean(),
          message: z.string(),
          email_id: z.string().optional(),
          attempts_remaining: z.number().optional(),
        }),
      },
      "400": {
        description: "Invalid request or email failed to send",
        ...contentJson({
          success: z.boolean(),
          errors: z.array(z.object({
            code: z.number(),
            message: z.string(),
          })),
          remaining_cooldown: z.number().optional(),
          attempts_remaining: z.number().optional(),
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
    const { email } = data.body;

    // Validate email with comprehensive checks
    const emailValidation = validateEmailWithTypoCheck(email);
    if (!emailValidation.isValid) {
      return c.json({
        success: false,
        errors: [{ code: 1000, message: emailValidation.error || "Invalid email format" }],
      }, 400);
    }

    try {
      // Generate OTP first (includes rate limiting)
      const otpResult = await createOTP(c.env.DB, email);
      
      if (!otpResult.success) {
        return c.json({
          success: false,
          errors: [{ code: 1004, message: otpResult.error || "Failed to generate OTP" }],
          remaining_cooldown: otpResult.remainingCooldown,
          attempts_remaining: otpResult.attemptsRemaining,
        }, 400);
      }

      // Prepare the email with OTP
      const emailPayload = {
        sender: "noreply@sokushuu.de",
        to: [email],
        subject: "Your Sokushuu Login Code",
        text_body: `Your login code is: ${otpResult.code}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`
      };

      // Get the API key from environment variables
      const apiKey = c.env.SMTP2GO_API_KEY;
      if (!apiKey) {
        return c.json({
          success: false,
          errors: [{ code: 1001, message: "SMTP2GO API key not configured" }],
        }, 500);
      }

      // Make the external API call
      const response = await fetch('https://api.smtp2go.com/v3/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Smtp2go-Api-Key': apiKey,
          'Accept': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        return c.json({
          success: false,
          errors: [{ code: 1002, message: `External API error: ${response.status} ${response.statusText}` }],
        }, 400);
      }

      const result: Smtp2goResponse = await response.json();

      // Check if email was successfully sent
      if (result.data && result.data.succeeded === 1) {
        return c.json({
          success: true,
          message: "Login code sent to your email",
          email_id: result.data.email_id,
          attempts_remaining: otpResult.attemptsRemaining,
        }, 200);
      } else {
        return c.json({
          success: false,
          errors: [{ code: 1003, message: "Failed to send email" }],
        }, 400);
      }

    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      
      // Handle other errors
      console.error("Auth login error:", error);
      throw new ApiException("Internal Server Error");
    }
  }
}