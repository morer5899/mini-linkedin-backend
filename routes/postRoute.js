import express from 'express';
import { 
  getAllPosts, 
  createPost, 
  getUserPosts 
} from '../controllers/postController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();


router.get('/', getAllPosts);


router.post('/', authMiddleware, createPost);


router.get('/:id/posts',authMiddleware, getUserPosts);

export default router;