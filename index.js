import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // Import cookie-parser
import connectDb from "./database/connectDb.js";
import router from "./routes/userRoute.js";
import postRouter from "./routes/postRoute.js";
dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5179',
  'https://your-frontend-domain.com' 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

app.use("/api/auth", router);
app.use("/api/posts", postRouter);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  connectDb();
  console.log(`Server is running on port ${PORT}`);
});
