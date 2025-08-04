import Post from '../models/postModel.js';
import User from '../models/userModel.js';

// Get all posts with author details
// In your posts controller
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username name')
      .lean();

    res.status(200).json({ 
      success: true, 
      posts,
      hasMore: posts.length === limit
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch posts' 
    });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const authorId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Content is required" 
      });
    }

    const newPost = await Post.create({ 
      content, 
      author: authorId 
    });

    await User.findByIdAndUpdate(authorId, {
      $push: { posts: newPost._id }
    });

    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'username name profilePicture') // Added name here
      .lean();

    res.status(201).json({ 
      success: true, 
      post: populatedPost 
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create post' 
    });
  }
};

// Get posts by user ID
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1) // Fetch one extra to check if there's more
      .populate('author', 'username name') // Populate author info
      .lean();

    const hasMore = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, -1) : posts;

    res.status(200).json({
      success: true,
      posts: resultPosts,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts',
      error: error.message
    });
  }
};