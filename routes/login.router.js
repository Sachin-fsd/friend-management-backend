const express = require("express");
const { RegisterModel } = require("../models/register.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const loginRouter = express.Router();

loginRouter.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await RegisterModel.findOne({ email });
    if (Object.keys(user).length === 0 || !user) {
      res.status(401).send({ msg: "Wrong credentials." });
    } else {
      bcrypt.compare(password, user.password, async (err, result) => {
        if (result) {
          const UserDetails = {
            UserID: user._id,
            UserName: user.name,
            UserEmail: user.email,
            UserDp: user.dp
          };
          const token = jwt.sign(
            { UserDetails: UserDetails },
            process.env.SECRET_KEY,
            { expiresIn: "7 days" }
          );
          res.cookie(
            "token",
            token,
            {
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
              sameSite: 'None',  // Allow cross-origin cookies
              // secure: process.env.NODE_ENV === 'production', // Use 'secure: true' in production if HTTPS is enabled
            }
          );
          res.cookie("UserDetails", JSON.stringify(UserDetails), {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7 * 1000,
            sameSite: 'None',
            // secure: process.env.NODE_ENV === 'production',
          });

          console.log("login successfull");
          res.status(200).send({ redirectTo: '/', token, UserDetails });
          // res.status(200).send({url:"/",UserDetails,token})
        } else {
          res.status(404).json({ msg: "Wrong Credentials" });
        }
      });
    }
  } catch (error) {
    res.status(400).json({ err: error });
  }
});

module.exports = { loginRouter };
