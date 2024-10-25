const { Schema, model } = require("mongoose");

const verificationSchema = new Schema(
  {
    user_id: {
      type: Schema.ObjectId,
      ref: "User",
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

verificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const VerificationEmailModel = model("Verification", verificationSchema);
module.exports = VerificationEmailModel;
