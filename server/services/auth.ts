import bcrypt from "bcrypt";
import { storage } from "../storage";

// Debug: Generate correct hash for "ChangeMe123!"
console.log("Generating hash for ChangeMe123!:", bcrypt.hashSync("ChangeMe123!", 10));

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async authenticateAdmin(username: string, password: string) {
    console.log("Auth attempt - Username:", username);
    const admin = await storage.getAdminByUsername(username);
    console.log("Admin found:", !!admin);
    if (!admin) return null;

    console.log("Stored password hash:", admin.password);
    console.log("Input password:", password);
    const isValid = await this.verifyPassword(password, admin.password);
    console.log("Password valid:", isValid);
    if (!isValid) return null;

    return admin;
  }
}