const express = require("express");
const { dbConnect } = require("./utils/db");
const app = express();
const cors = require("cors");
const http = require('http')
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT;
// const socket = require('socket.io');
const { userInfo } = require("os");

const server = http.createServer(app)

// const cors = require("cors");
app.use(
  cors({
    origin: "*", // Accepts all origins
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);




dbConnect();




app.use(bodyParser.json());
app.use(cookieParser());
// Routes

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use('/api', require('./routes/dataCleaningRoutes'));


server.listen(port, () => {
  // Log the configuration
  console.log(`Server is running on http://localhost:${port}`);
});
