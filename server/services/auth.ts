import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { storage } from "../storage";

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async authenticateAdmin(username: string, password: string) {
    const admin = await storage.getAdminByUsername(username);
    if (!admin) return null;

    const isValid = await this.verifyPassword(password, admin.password);
    if (!isValid) return null;

    return admin;
  }

  static generateTotpSecret(username: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `ClassStore Admin (${username})`,
      issuer: "ClassStore",
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
    };
  }

  static async generateQRCode(qrCodeUrl: string): Promise<string> {
    return qrcode.toDataURL(qrCodeUrl);
  }

  static verifyTotpToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      token,
      window: 1,
      encoding: "base32",
    });
  }

  static async setupAdminTotp(adminId: string): Promise<{ secret: string; qrCode: string }> {
    const admin = await storage.getAdmin(adminId);
    if (!admin) throw new Error("Admin not found");

    const { secret, qrCodeUrl } = this.generateTotpSecret(admin.username);
    const qrCode = await this.generateQRCode(qrCodeUrl);

    await storage.updateAdminTotpSecret(adminId, secret);

    return { secret, qrCode };
  }

  static async completeTotpSetup(adminId: string, token: string): Promise<boolean> {
    const admin = await storage.getAdmin(adminId);
    if (!admin || !admin.totpSecret) return false;

    const isValid = this.verifyTotpToken(token, admin.totpSecret);
    if (!isValid) return false;

    await storage.setAdminSetup(adminId);
    return true;
  }
}
