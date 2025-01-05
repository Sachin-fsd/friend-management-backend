const express = require("express");
const cors = require("cors");
const app = express();
const registerRouter  = require("./routes/register.router");
const { loginRouter } = require("./routes/login.router");
const connectDB = require("./configs/db");
const { searchRouter } = require("./routes/search.router.js");
const cookieParser = require("cookie-parser");
const { authenticator } = require("./middleware/authenticator.middleware.js");
const { feedRouter } = require("./routes/feed.router.js");
const { requestRouter } = require("./routes/request.router.js");
const { suggestionRouter } = require("./routes/suggestions.router.js");

require("dotenv").config();

const corsOptions = {
  origin: 'http://localhost:5173', // replace with your React app origin
  credentials: true,
};
app.use(cors(corsOptions));


// app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());


// app.get("/welcome", (req, res) => {
//   res.redirect("/landing");
// });
app.get("/test",(req,res)=>{
  return res.json({msg:"hello"})
})
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/",authenticator, feedRouter);
app.use("/request",authenticator, requestRouter);
app.use("/suggestions",authenticator,suggestionRouter);
app.get("/user",authenticator,(req,res)=>{
  let {UserDetails} = req.body;
  // console.log(req.user)
  res.send(req.user)
})
// app.get("/contacts",authenticator,async(req,res)=>{
//   // console.log(req.body,req.user)
//   try {
//     const messages = await MessageModel.find({
//     $or: [{ "sender.UserID": req.user.UserID }, { "receiver.UserID": req.user.UserID }],
//   }).sort({ updatedAt: -1 });
//   // Fetch the users
//   let users = [];
//   if (messages.length < 5) {
//     users = await RegisterModel.find({}, { _id: 1, name: 1, dp: 1 })
//       .sort({ CreatedAt: -1 })
//       .limit(5);
//   }
//   // console.log({messages,users})
//   res.send({messages,users})
//   } catch (error) {
//     console.log(error)
//     res.send({msg:error})
//   }
// })

app.use("/search", authenticator, searchRouter);

// app.use("/", authenticator, postRouter);

// to get data from database

app.get("/api/users", async (req, res) => {
  const users = await RegisterModel.find().limit(10);
  res.send(users);
});


app.use((req, res) => {
  res.status(404).send({ title: 'Not Found' });
});

// const fetch = (...args) =>
//   import("node-fetch").then(({ default: fetch }) => fetch(...args));

// const io = new Server(server);
// io.on("connection", (socket) => {
//   console.log("user connected");

//   socket.on("join room", (postID) => {
//     socket.join(postID);
//   });
  // socket.on("join message room", (receiverID) => {
  //   socket.join(receiverID);
  // });

//   socket.on("leave room", (postID) => {
//     socket.leave(postID);
//   });

//   socket.on("new comment",async (comment) => {
//     io.to(comment.postID).emit("new comment", comment);
//   });

//   socket.on("new chat", (comment) => {
//     socket.to(comment.postID).emit("new chat", comment);
//     socket.to(comment.receiverID).emit("new chat", comment);
//   });

//   socket.on("done reading", (comment) => {
//     socket.to(comment.postID).emit("done reading", comment);
//   });
// });

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("listening for requests");
  });
});


// async function updateFieldForStudents() {
//   try {
//     // Update a specific field for all users where role is 'student'
//     const result = await RegisterModel.updateMany(
//       { },       // Condition
//       { $set: { course: 'btech' } } // Update operation: set the field with a new value
//     );
    
//     // console.log(`Updated ${result.nModified} student records.`);
//   } catch (err) {
//     console.error('Error updating students:', err);
//   }
// }

// Call the function to update the field
// updateFieldForStudents();
