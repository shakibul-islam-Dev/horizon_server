import { Cart, CartDocument } from "../models/Cart";
import { Item } from "../models/Item";
import { NotFoundError } from "../utils/ApiError";

export class CartService {
  static async getCart(userId: string): Promise<CartDocument> {
    let cart = await Cart.findOne({ user: userId }).populate(
      "items.item",
      "title price images status"
    );
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
  }

  static async addToCart(
    userId: string,
    itemId: string,
    quantity = 1
  ): Promise<CartDocument> {
    const item = await Item.findById(itemId);
    if (!item) throw new NotFoundError("Item not found");
    if (item.status !== "active") throw new NotFoundError("Item is not available");

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
      (i) => i.item.toString() === itemId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ item: itemId as any, quantity });
    }

    await cart.save();
    return cart.populate("items.item", "title price images status");
  }

  static async updateCartItem(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<CartDocument> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError("Cart not found");

    const existingItem = cart.items.find(
      (i) => i.item.toString() === itemId
    );
    if (!existingItem) throw new NotFoundError("Item not in cart");

    existingItem.quantity = quantity;
    await cart.save();
    return cart.populate("items.item", "title price images status");
  }

  static async removeFromCart(
    userId: string,
    itemId: string
  ): Promise<CartDocument> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError("Cart not found");

    cart.items = cart.items.filter(
      (i) => i.item.toString() !== itemId
    );
    await cart.save();
    return cart.populate("items.item", "title price images status");
  }

  static async clearCart(userId: string): Promise<CartDocument> {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError("Cart not found");

    cart.items = [];
    await cart.save();
    return cart.populate("items.item", "title price images status");
  }

  static async getCartTotal(userId: string): Promise<number> {
    const cart = await Cart.findOne({ user: userId }).populate("items.item", "price");
    if (!cart) return 0;

    return cart.items.reduce((total, cartItem) => {
      const item = cartItem.item as any;
      return total + (item.price || 0) * cartItem.quantity;
    }, 0);
  }
}
