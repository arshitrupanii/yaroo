import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 40,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],
}, { timestamps: true });

groupSchema.index({ members: 1, updatedAt: -1 });
groupSchema.index({ createdBy: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
