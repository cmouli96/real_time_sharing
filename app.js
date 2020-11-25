const express = require('express')
const app = express()
const db = require("./db").db;
const bodyParser= require('body-parser')
const logininfo = require('./models/logininfo')
app.set('view engine', 'ejs')

//app.use(app.static(__dirname+'/public'))
app.use(express.static(__dirname + '/public/images'));


app.use(bodyParser.urlencoded({ extended: true }))


// app.listen(3000, function() {
//     console.log('listening on 3000')
//   })



app.get('/', (req, res)=>{
    res.render('index1.ejs', {infy : " "})
})



app.post('/register', (req, res)=>{

  
  
                            (async()=>{

                              console.log(req.body)
                              const info = await logininfo.find({email : req.body["email"]})
                              if(info.length == 0)
                              {
                                  const reg_details = new logininfo(req.body);
                                  reg_details.save(function(error, doc){
                                      if(error) console.error(error)
                                      console.log(doc)
                                  });
                                  res.redirect("/");
                              }
                              else
                              {
                                res.render('index1.ejs', {infy : "Invalid Registration"})
                              }
                              

                            })();
  })


  app.post("/login", (req, res)=>{

    (async()=>{
        const info = await logininfo.findOne({email : req.body["email"]})
        // console.log(info)
        // console.log(req.body)
        if(info.length == 0)
        {
          res.render("index1.ejs", {infy : "Invalid Login"})
        }
        else
        {
          const pwd = info["pwd"]
          // console.log(pwd)
          // console.log(req.body['pwd'])
          if(req.body['pwd'] == pwd)
          {
            // res.send("login successful")
            res.redirect("/user")
          }
          else
          {
            res.render("index1.ejs", {infy : "Invalid Login"})
          }
        }
    })();
  })
// const express = require("express");
// const app = express();

const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");

// Middlewares
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static(__dirname+'/public'));

// DB
const mongoURI = "mongodb://localhost:27017/node-file-upl";

// connection
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// init gfs
let gfs;
conn.once("open", () => {
  // init stream
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads"
  });
});

// Storage
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        // const filename = buf.toString("hex") + path.extname(file.originalname);
        const filename=file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({
  storage
});

// get / page
app.get("/user", (req, res) => {
  if(!gfs) {
    console.log("some error occured, check connection to db");
    res.send("some error occured, check connection to db");
    process.exit(0);
  }
  gfs.find().toArray((err, files) => {
    // check if files
    if (!files || files.length === 0) {
      return res.render("index", {
        files: false
      });
    } else {
      const f = files
        .map(file => {
          if (
            file.contentType === "image/png" ||
            file.contentType === "image/jpeg"
          ) {
            file.isImage = true;
          } else {
            file.isImage = false;
          }
          return file;
        })
        .sort((a, b) => {
          return (
            new Date(b["uploadDate"]).getTime() -
            new Date(a["uploadDate"]).getTime()
          );
        });

      // return res.render("index", {
      //   files: f
      // });
      return res.render("main",{
        files:f
      })
    }

    // return res.json(files);
  });
});

app.get("/fi",function(req,res){
  res.render("main");
})

app.post("/upload", upload.single("file"), (req, res) => {
  // res.json({file : req.file})
  res.redirect("/user");
});

app.get("/files", (req, res) => {
  gfs.find().toArray((err, files) => {
    // check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "no files exist"
      });
    }

    return res.json(files);
  });
});

app.get("/files/:filename", (req, res) => {
  gfs.find(
    {
      filename: req.params.filename
    },
    (err, file) => {
      if (!file) {
        return res.status(404).json({
          err: "no files exist"
        });
      }

      return res.json(file);
    }
  );
});

app.get("/image/:filename", (req, res) => {
  // console.log('id', req.params.id)
  const file = gfs
    .find({
      filename: req.params.filename
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist"
        });
      }
      gfs.openDownloadStreamByName(req.params.filename).pipe(res);
    });
});

// files/del/:id
// Delete chunks from the db
app.post("/files/del/:id", (req, res) => {
  gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
    if (err) return res.status(404).json({ err: err.message });
    res.redirect("/user");
  });
});

const port = 3000;

app.listen(port, () => {
  console.log("server started on " + port);
});