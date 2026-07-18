import { User, UserDocument } from "../models/User";
import { NotFoundError } from "../utils/ApiError";

export class UserService {
  static async getProfile(userId: string): Promise<UserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  static async updateProfile(
    userId: string,
    updateData: {
      name?: string;
      image?: string;
      preferences?: {
        categories?: string[];
        priceRange: { min?: number; max?: number };
      };
    }
  ): Promise<UserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.image !== undefined) user.image = updateData.image;
    if (updateData.preferences) {
      if (updateData.preferences.categories) {
        user.preferences.categories = updateData.preferences.categories as any;
      }
      if (updateData.preferences.priceRange) {
        if (updateData.preferences.priceRange.min !== undefined) {
          user.preferences.priceRange.min = updateData.preferences.priceRange.min;
        }
        if (updateData.preferences.priceRange.max !== undefined) {
          user.preferences.priceRange.max = updateData.preferences.priceRange.max;
        }
      }
    }

    await user.save();
    return user;
  }

  static async getPublicProfile(userId: string) {
    const user = await User.findById(userId).select("name image createdAt");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
}
