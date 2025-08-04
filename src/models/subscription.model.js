import mongoose, { Schema } from "mongoose";

export const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
