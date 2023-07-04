const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
    {
      userId:[{type: Schema.Types.ObjectId, ref:'User'}],
      comment:{type: String},
      linhasId: [{type: Schema.Types.ObjectId, ref:'Linhas'}],
      panelasId: [{type: Schema.Types.ObjectId, ref:'Panelas'}],
      pinceisId: [{type: Schema.Types.ObjectId, ref:'Pinceis'}]
    },
    {
      // this second object adds extra properties: `createdAt` and `updatedAt`
      timestamps: true,
    }
  );
  
  const Comment = model("Comment", commentSchema);
  
  module.exports = Comment;