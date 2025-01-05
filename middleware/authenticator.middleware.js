const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authenticator = async (req, res, next) => {
  console.log("auth start", req.url, " line 6");
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1] || "";
    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
      if (err) {
        console.log("auth token started", req.url, req.route, token, "line 10");
        return res.status(400).send({ redirectTo: '/login' });
      } else {
        req.user = decoded.UserDetails
        req.body.UserDetails = decoded.UserDetails;
        console.log("auth end", req.url, "line 17");
        next();
      }
    });
  } catch (error) {
    return res.status(400).send({ redirectTo: "/login", msg: "Authentication failed" })
  }
};

module.exports = { authenticator };
