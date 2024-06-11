import mongoose from "mongoose";
const Schema = mongoose.Schema;

const Conversation = new mongoose.Schema({
  conversation: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const ConversationModel = mongoose.model("conversation", Conversation);

export default ConversationModel;
