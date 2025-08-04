import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [1, 'Content too short'],
    maxlength: [1000, 'Content exceeds 1000 characters'],
    index: 'text'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true
  }],
  tags: [{
    type: String,
    trim: true,
    index: true,
    maxlength: [20, 'Tag exceeds 20 characters']
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for counts
postSchema.virtual('likeCount').get(function() {
  return this.likes?.length || 0;
});

postSchema.virtual('commentCount').get(function() {
  return this.comments?.length || 0;
});


postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ likes: 1, createdAt: -1 });
postSchema.index({ tags: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ updatedAt: -1 });

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
export default Post;