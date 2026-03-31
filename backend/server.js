const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://vivek1907004_db_user:uGYJipFbVvRK0WXQ@cluster0.fyw3khl.mongodb.net/?appName=Cluster0")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const userSchema = new mongoose.Schema({

    name: String,
    role: String,
    email: String
});

const User = mongoose.model("User",userSchema);

app.post("/user",async (req,res) => {
    try{
        const newUser = new User(req.body);
        await newUser.save();

        res.json({message: "User Saved Successfully"});
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
});

app.get("/users",async (req,res) => {
    try{
        const users = await User.find();
        res.json(users);
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});