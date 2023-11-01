import express  from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import db from "./config/Database.js";
import cors from "cors";
import router from "./routes/index.js";
dotenv.config();
const app = express();

try {
    await db.authenticate();
    console.log("Database connected..");
    // await db.sync();
} catch (error) {
    console.log('Error: ',error);
}

app.use(cors({credentials: true, origin:'http://localhost:3000'}))
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(router)
app.listen(5000, () => console.log('Server running at port 5000'));