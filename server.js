import express from 'express';
import router from './src/routes/Transactions.js';



const server = express()

server.get("/health" , (_ , res)=>{
    res.json({success:true})
})

server.use("/transactions", router)


server.use((req,res)=>{
    res.status(404).json({error:"not found"})
})





server.listen("3000" , (e)=>{
    console.log("server running on http://localhost:3000")
})