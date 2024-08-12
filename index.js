import express from 'express';
import pg from 'pg';
import multer from 'multer';
import bodyParser from "body-parser";
import path from "path";

const app = express();
const port = 3030;

app.use(express.static('public'));
app.use(express.static("imageUploads"))
app.use(bodyParser.urlencoded({extended: true}));


const db = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

db.connect();


const createTable = async() =>{
    try{
        const result = await db.query("create table if not exist blogs(id serial primary key, title text, content text, author text, image text, date text)");
        console.log("Table created");
    }catch(err){
        console.error("Error creating table", err.stack);
    }
}
createTable();
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "imageUploads");
    },
    filename: function (req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage: storage});


app.get("/", async(req, res)=>{
    let blogPosts = [];
    const articles = await db.query("select * from blogs");
    console.log(blogPosts);
    blogPosts = articles.rows;
    console.log(blogPosts);
    res.render("index.ejs", {article: blogPosts});
})

app.get("/newBlog", (req, res)=>{
    res.render("newBlog.ejs")
})

app.get("/blog/:id", async(req, res)=>{
    const id = parseInt(req.params.id);
    const blogPosts = await db.query("select * from blogs");
    const post = blogPosts.rows.find((a)=> a.id === id);
    res.render("article.ejs", {article: post});
})

app.get("/blog", async(req, res)=>{
    const articles = await db.query("select * from blogs");
    const blogPosts = articles.rows;
    res.render("blog.ejs", {article: blogPosts});
})
app.post("/upload", upload.single("articleImage"), async(req, res)=>{
    if(!req.file){
        res.status(400).send("No file uploaded");
    }
    try {
        await db.query("insert into blogs(title, author, content, image, date) values ($1, $2, $3, $4, $5)", [req.body.title, req.body.author, req.body.content, req.file.filename, Date()]);
        console.log("Successfully inserted to the database.");
        res.render("newBlog.ejs");
    } catch (error) {
        console.error('Error inserting into database', error);
    }
})
app.listen(port, ()=>{
    console.log("Connection Established Successfully at PORT ", port);
})