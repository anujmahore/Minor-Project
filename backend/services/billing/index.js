import express from "express"
import dotenv from "dotenv"
import dns from "dns";
import connectDb from "./config/db.js"
import router from "./routes/billing.route.js"

dotenv.config()

// I am adding

dns.setServers(["8.8.8.8","1.1.1.1"]);

const port =process.env.PORT

const app=express()
app.use(express.json())
app.use("/",router)
app.get("/",(req,res)=>{
    res.json({message:"hello from billing"})
})

app.listen(port,()=>{
    console.log(`billing started at ${port}`)
    connectDb()
})
