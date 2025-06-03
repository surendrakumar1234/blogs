require("dotenv").config();
const path = require("path");
const fs = require("fs");
// const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
// const index2 = require("./index2");

const express = require("express");
const app = express();

// Cors
const cors = require("cors");
const corsOptions = {
  origin: process.env.ALLOWED_CLIENTS.split(","),
  // ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:3300']
};

// Default configuration looks like
// {
//     "origin": "*",
//     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//     "preflightContinue": false,
//     "optionsSuccessStatus": 204
//   }

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
  fs.readFile("./homepage.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return res.send("<h1>Error Ho Gaya Bhai.</h1>");
    } else {
      let jobs;
      fs.readFile("./jobbulatin.json", "utf-8", (err, jobdata) => {
        if (err) {
          console.log(err);
          return res.send("hello2");
        } else {
          jobs = JSON.parse(jobdata);
          // console.log("jobbulatin", jobs);

          const fsdata = JSON.parse(data);
          fsdata.forEach((data, i) => {
            const blogId = data.timeStamps;
            const uid = data.id;
            data.uid = uid;
            data.id = blogId;
            

            //added on 16 march
            let colors = [
              "#0f86f5",
              "#83b82e",
              "#ff554b",
              "#f89c1d",
              "#39c3a2",
              "#9d46f3",
              "#7059ff",
              "#3e9e3e",
            ];
            if (i >= colors.length) {
              const clrId = i - colors.length;
              if (clrId >= colors.length) {
                data.color = colors[0];
              } else {
                data.color = colors[clrId];
              }
            } else {
              data.color = colors[i];
            }
            //added on 16 march

            const date = new Date(data.timeStamps);
            const currDate = new Date();
            const yearGap = currDate.getFullYear() - date.getFullYear();
            const monthGap = currDate.getMonth() - date.getMonth();
            const dayGap = currDate.getDate() - date.getDate();
            const hourGap = currDate.getHours() - date.getHours();
            const minGap = currDate.getMinutes() - date.getMinutes();
            const secGap = currDate.getSeconds() - date.getSeconds();

            if (yearGap !== 0) {
              data.timeStamps = yearGap + " year ago";
            } else if (monthGap !== 0) {
              data.timeStamps = monthGap + " month ago";
            } else if (dayGap !== 0) {
              data.timeStamps = dayGap + " day ago";
            } else if (hourGap !== 0) {
              data.timeStamps = hourGap + " hour ago";
            } else if (minGap !== 0) {
              data.timeStamps = minGap + " minutes ago";
            } else if (secGap !== 0) {
              data.timeStamps = secGap + " seconds ago";
            } else {
              data.timeStamps = date.toLocaleTimeString().toLowerCase();
            }
          });
          // console.log(fsdata);
          if (req.query.type) {
            return res.json(fsdata);
          }
          return res.render("homepage", {
            fsdata,
            jobs,
            route: "/",
          });
        }
      });
    }
  });
});

app.get("/api/:id", (req, res) => {
  if (!Number(req.params.id)) {
    return res.json({ err: "This Blog Is No Longer Available" });
  }
  fs.readFile("./homepage.json", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return res.send("hello");
    } else {
      const fsdata = JSON.parse(data);
      const findedBlog = fsdata.find((blog) => blog.id == req.params.id);
      if (!findedBlog) {
        return res.json({ err: "This Blog Is No Longer Available" });
      }

      fs.readFile("./blogs.json", "utf-8", (err, data) => {
        if (err) {
          console.log(err);
          res.send("<h1>Error Ho Gaya Bhai</h1>");
        } else {
          let fsdata = JSON.parse(data);

          //added 16 March
          let relatePosts = fsdata.filter(
            (blog) => blog.id <= 5 && blog.timeStamps !== findedBlog.timeStamps
          );
          // console.log(relatePosts);
          //added 16 March

          fsdata = fsdata.find(
            (blog) => blog.timeStamps == findedBlog.timeStamps
          );
          if (fsdata) {
            fsdata.id = findedBlog.id;

            // console.log(fsdata);
            return res.status(200).json(fsdata);
          } else {
            res.send("<h1>किसी कारणवश ये पोस्ट डिलीट कर दी गई है |</h1>");
          }
        }
      });
    }
  });
});

app.listen();
