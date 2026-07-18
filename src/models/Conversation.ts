import mongoose, { Schema, Document } from "mongoose";

export interface IConversation {
  _id: mongoose.Types.ObjectId;
  user: string;
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDocument extends IConversation, Document {}

const conversationSchema = new Schema<ConversationDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: [true, "Message role is required"],
        },
        content: {
          type: String,
          required: [true, "Message content is required"],
          maxlength: [10000, "Message cannot exceed 10000 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

conversationSchema.index({ user: 1, createdAt: -1 });

export const Conversation = mongoose.model<ConversationDocument>(
  "Conversation",
  conversationSchema
);
