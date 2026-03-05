import express from "express";
import router from "./src/routes/Transactions.js";
import { connectDB } from "./src/db/connect.js";

const server = express();

server.get("/health", async (_, res) => {
    res.json({ success: true});
});

server.use("/transactions", router);

server.use((req, res) => {
    res.status(404).json({ error: "not found" });
});

server.listen("3000", async (e) => {
    await connectDB();
    console.log("server running on http://localhost:3000");
});
