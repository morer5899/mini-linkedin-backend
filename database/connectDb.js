import mongoose from "mongoose";

const connectDb=async()=>{
  try {
    const db=await mongoose.connect(`${process.env.MONGO_URL}`);
    if(db){
      console.log("connected to database")
    }
  } catch (error) {
    console.log("database connection error ======>",error)
  }
}

export default connectDb;