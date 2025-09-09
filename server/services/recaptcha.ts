export class RecaptchaService {
  static async verifyToken(token: string): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET;
    if (!secretKey) {
      console.warn("RECAPTCHA_SECRET not configured, skipping verification");
      return true; // Allow in development
    }

    try {
      const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      return false;
    }
  }
}
