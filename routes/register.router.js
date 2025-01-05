const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const nodemailer = require("nodemailer")
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const { RegisterModel } = require("../models/register.model");


const registerRouter = express.Router();
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIN_ADMIN,
        pass: process.env.MAIN_PASSWORD
    }
})

registerRouter.post("/", async (req, res) => {
    try {

        let { name, email, password } = req.body;
        const user = await RegisterModel.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "User already exists." })
        } else {
            const token = crypto.randomBytes(16).toString('hex');
            const hashed = await bcrypt.hash(password, 2);
            await RegisterModel.create({
                name,
                email,
                password: hashed,
            });
            transporter.sendMail({
                to: email,
                from: process.env.mail_admin,
                subject: 'Welcome to FriendZ!',
                text: `Dear ${name},
            
Thank you for registering at FriendZ! We're thrilled to have you on board.

We're committed to providing you with the best experience possible.
If you have any questions, need help, want to report a bug, or just want to share your thoughts,
Please feel free to reply to this email. We're here to help!

Looking forward to seeing you on FriendZ.

Best,
Sachin
Founder and CEO`
            })

                .then(() => {
                    console.log("mail send successfully!");

                })
                .catch((err) => {
                    console.log("Error while sendig mail")
                    console.log(err)
                })
            res.status(201).json({msg:"verified, Account Created", ok:true})
        }
    } catch (err) {
        console.log(err);
        res.send({ msg: "Someting went wrong", ok: false })
    }
})


module.exports = registerRouter