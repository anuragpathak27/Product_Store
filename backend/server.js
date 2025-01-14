import express from 'express';

const app = express();

app.get("/products", (req,res)=>{});

app.listen(5000, ()=> {
    console.log("Server Started at localhost:5000");
});