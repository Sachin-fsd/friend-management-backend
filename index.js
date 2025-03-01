const express = require("express");
const cors = require("cors");
const app = express();
const registerRouter = require("./routes/register.router");
const { loginRouter } = require("./routes/login.router");
const connectDB = require("./configs/db");
const { searchRouter } = require("./routes/search.router.js");
const cookieParser = require("cookie-parser");
const { authenticator } = require("./middleware/authenticator.middleware.js");
const { feedRouter } = require("./routes/feed.router.js");
const { requestRouter } = require("./routes/request.router.js");
const { suggestionRouter } = require("./routes/suggestions.router.js");
const { RegisterModel } = require("./models/register.model.js");
const path = require('path');

require("dotenv").config();

const corsOptions = {
  origin: 'https://friendz-zeta.vercel.app', // replace with your React app origin
  credentials: true,
};
app.use(cors(corsOptions));

// Serve static files for production (React build)
app.use(express.static(path.join(__dirname, 'client/build')));

// This will handle all routes and redirect them to the React app


app.use(cookieParser());
app.use(express.json());

app.get("/test", (req, res) => {
  return res.json({ msg: "hello" })
})
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/search", authenticator, searchRouter);
app.use("/request", authenticator, requestRouter);
app.use("/suggestions", authenticator, suggestionRouter);
app.use("/", authenticator, feedRouter);
app.get("/user", authenticator, (req, res) => {
  let { UserDetails } = req.body;
  res.send(req.user)
})


app.get("/api/users", async (req, res) => {
  const users = await RegisterModel.find().limit(10);
  res.send(users);
});


app.use((req, res) => {
  res.status(404).send({ title: 'Not Found' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 8080;

// to deploy in vercel we need to remove app.listen

// app.listen(PORT, () => {
//   // connectDB();
//   console.log("listening for requests");
// });

//instead we need to export it 
module.exports = app;
