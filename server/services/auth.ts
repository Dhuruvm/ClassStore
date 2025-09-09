import bcrypt from "bcrypt";
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
}