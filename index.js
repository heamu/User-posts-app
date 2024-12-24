const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt= require('jsonwebtoken');
const usermodel = require('./models/user');
const postmodel = require('./models/post');
// instead of ./models/post i wrote ./models/user again with this i wasted half day
// listen collections in data base wont be created by running the files in model
//we have to run index.js file to do that ok


const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());
app.set('views',path.join(__dirname,'views'));


app.get('/',(req,res)=>{
    res.render('index');
})

app.post('/create',async (req,res)=>{
    const {name, username,email,password,age} = req.body;
    
    const user = await usermodel.findOne({email});

    if(user){
         return res.status(300).send("email alredy exists");
    }

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
            const userCreated = await usermodel.create({
                 name,
                 username,
                 email,
                 password:hash,
                 age
            })

             const token = jwt.sign({email:email , userid : userCreated._id},"secret");
              res.cookie("token",token);
              res.redirect('profile');
        })
    });
    

})

app.get('/login',(req,res)=>{
    res.render("login")
})

app.post('/login',async (req,res)=>{

    res.cookie('token',"");
    const {email,password} = req.body;

    const user = await usermodel.findOne({email});
    
    if(!user){
        //return res.status(300).send("OOps something went wrong.....");
        res.redirect('/login');
        return;
    }

    const check = await bcrypt.compare(password,user.password);
    if(!check){
        res.redirect('/login');
        return;
    }
   
    const token = jwt.sign({email:user.email,userid : user._id},"secret");
    res.cookie("token",token);
    res.redirect('/profile');

})

app.get('/logout',(req,res)=>{
    res.cookie('token',"");
    res.redirect('/login');
})

app.post('/delete_post/:post_id',isLoggedIn,async(req,res)=>{
    const post_deleted = await postmodel.findOneAndDelete({_id:req.params.post_id});

    const user_of_post = await usermodel.findOne({_id:req.user.userid});

    user_of_post.posts.splice(req.params.post_id,1);
    await user_of_post.save();

    res.redirect('/profile');
})

app.get('/profile',isLoggedIn,async (req,res)=>{
    const user = await usermodel.findOne({email:req.user.email}).populate("posts");
    res.render('profile',{user});
})

app.post('/post',isLoggedIn,async (req,res)=>{
    const user = await usermodel.findOne({email:req.user.email});
    const createdPost =await  postmodel.create({
        user:req.user._id,
        text:req.body.data
    })
    user.posts.push(createdPost._id);
    
    await user.save();
    res.redirect("/profile");

})

function isLoggedIn(req,res,next){
    if(req.cookies.token=="")res.redirect('/login');
    else{
        let data = jwt.verify(req.cookies.token,"secret");
        req.user = data;
        next();
    }
}

app.get('/like/:postid',isLoggedIn,async (req,res)=>{
    
    const post = await postmodel.findOne({_id:req.params.postid});
     const check = post.likes.findIndex(function(like) {  
        return like.toString() === req.user.userid;  
    }); 
    if(check==-1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(check, 1);
    }
    await post.save();
    res.redirect('/profile');

})

app.post('/edit/:postid',isLoggedIn,async(req,res)=>{
     const post = await postmodel.findOneAndUpdate({_id:req.params.postid},{text:req.body.data});
     res.redirect('/profile');
})

app.get("/see_others/:userid",(req,res)=>{

    res.render("check");
})

app.get("/edit/:postid",isLoggedIn,async(req,res)=>{
    //console.log(req.params.postid);
    const posted = await postmodel.findOne({_id:req.params.postid});
    console.log(posted);
    res.render('edit',{post:posted});
})

app.listen(3000,(err)=>{
    console.log("server connected....");
})