require("dotenv").config();
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const express = require("express");
const app = express();
const port = process.env.port || 3000;
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

app.get("/", async (req, response) => {
  try {
    const res = await fetch("https://skresult.com");
    const htmlData = await res.text();
    const $ = cheerio.load(htmlData);
    let newBlogs = [];
    $("article").each(async (index, element) => {
      let blogPageUrl = $(element).find("header").find("h2>a").attr("href");
      blogPageUrl = blogPageUrl.replace("https://skresult.com/", "");
      console.log(blogPageUrl);

      let title = $(element).find("header").find("h2>a").text().trim();
      title = title.replaceAll("\n", "");
      let timeStamps = $(element)
        .find("header")
        .find("div>span>time")
        .attr("datetime");
      let thumbnailUrl = $(element)
        .find("div.post-image>a>img")
        .attr("data-lazy-src");
      if (!thumbnailUrl) {
        thumbnailUrl = $(element).find("div.post-image>a>img").attr("src");
      }
      let id = newBlogs.length + 1;
      let category = $(element).find("footer>span.cat-links>a").text();
      newBlogs.push({
        title,
        timeStamps,
        thumbnailUrl,
        id,
        blogPageUrl,
        category,
      });
    });
    console.log(newBlogs);
    return response.json(newBlogs);
  } catch (error) {
    return res.json(error);
  }
});

app.get("/search", (req, res) => {
  if (req.query.query) {
    fs.readFile("./homepage.json", "utf-8", (err, data) => {
      if (err) {
        console.log(err);
        res.send("Error Ho gaya Bhai");
      } else {
        let fsdata = JSON.parse(data);
        fsdata = fsdata.filter((blog) =>
          blog.title.toLowerCase().includes(req.query.query.toLowerCase())
        );
        if (fsdata) {
          // console.log("fsdata", fsdata);
          res.render("searchpage", {
            fsdata,
          });
        } else {
          res.send("No results found");
        }
      }
    });
  } else {
    res.render("searchpage");
  }
});

app.get("/results", (req, res) => {
  fs.readFile("./homepage.json", (err, data) => {
    if (err) {
      console.log(err);
      res.send("Erro ho gaya bhai");
    } else {
      let fsdata = JSON.parse(data);
      fsdata = fsdata.filter((blog) =>
        blog.category.toLowerCase().includes("result")
      );
      if (fsdata) {
        // console.log("fsdata", fsdata);
        res.json(fsdata);
      } else {
        res.json({ msg: "No results found" });
      }
    }
  });
  return res.json;
});

app.get("/admitcard", (req, res) => {
  fs.readFile("./homepage.json", (err, data) => {
    if (err) {
      console.log(err);
      res.send("<h1>Erro ho gaya bhai</h1>");
    } else {
      let fsdata = JSON.parse(data);
      fsdata = fsdata.filter((blog) =>
        blog.category.toLowerCase().includes("admit")
      );
      if (fsdata) {
        // console.log("fsdata", fsdata);
        res.json(fsdata);
      } else {
        res.json({ msg: "No results found" });
      }
    }
  });
  return res.json;
});

app.get("/api/blog/:id", async (req, response) => {
  try {
    const blogurl = "https://skresult.com/" + req.params.id;
    console.log(blogurl);
    const res = await fetch(blogurl);
    const htmlData = await res.text();

    const $ = cheerio.load(htmlData);
    let title = $("article>div>header>h1").text().trim();
    title = title.replaceAll("\n", "");
    let timeStamps = $("article")
      .find("header")
      .find("time")
      .attr("datetime")
      .trim();
    let thumbnailUrl = $("article")
      .find("div>figure>img")
      .attr("data-lazy-src");
    let content = $("article").find("div.entry-content").toString();
    content = content.replaceAll("\n", "");
    content = content.replaceAll("https://skresult.com", "");
    content = content.replaceAll("skresult.com", "");
    content = content.replaceAll("SKResult.com", "");
    content = content.replaceAll("WhatsApp Group", "");
    content = content.replaceAll(
      "https://www.whatsapp.com/channel/0029Va4UN8U29757sLNagO25",
      ""
    );
    content = content.replaceAll(
      "whatsapp.com/channel/0029Va4UN8U29757sLNagO25",
      ""
    );
    content = content.replaceAll("Telegram Group", "");
    content = content.replaceAll(
      "https://telegram.me/skresult",
      "https://telegram.me/levitt25"
    );
    content = content.replaceAll("skresult", "levitt25");
    content = content.replaceAll("Join Now", "https://telegram.me/levitt25");
    const blog = {
      id: req.params.id,
      title,
      timeStamps,
      thumbnailUrl,
      content,
    };

    return response.json(blog);
  } catch (error) {
    return response.json(error);
  }
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

app.listen(port,(err)=>{
  if(err){
    console.log(err)
  }
  console.log(port+"server start ho gaya")
});
