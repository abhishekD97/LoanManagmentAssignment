//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
// const Loan = require("loanjs").Loan

app.use(bodyParser.urlencoded({extended:false}))
app.use(express.static("public"))
app.set('view engine','ejs')

app.use(session({
  secret:process.env.Access_Token,
  resave:false,
  saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/loanDB",{ useNewUrlParser: true,useUnifiedTopology: true });
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const usersSchema = new mongoose.Schema({
  role:String,
  email:String,
  password:String
})

usersSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",usersSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser(function(user, done) {
  done(null, user);
}));
passport.deserializeUser(User.deserializeUser(function(user, done) {
  done(null, user);
}));

// var loan = new Loan(200000,24,20);
// console.log(loan.installments[0].installment);

app.get("/",function(req,res){
  res.render("home");
})

app.get("/home", function(req, res) {
  res.render("home");
})

app.get("/login",function(req,res){
  res.render("login");
})

app.get("/register",function(req,res){
  res.render("register");
})

app.get("/secrets", function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets")
  }else{
    res.redirect("/login")
  }
})

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
})

app.post("/register",function(req,res){
  if(req.body.role === "Customer"){
  User.register({username:req.body.username,role:"Customer"},req.body.password,function(err,user){
if(err){
  console.log(err);
  res.redirect("/register");
}else{
  passport.authenticate("local")(req,res,function(){
    res.redirect("/secrets")
  })
}
})
}else if(req.body.role === "Agent"){
  if(req.body.key === process.env.AgentKey){
  User.register({username:req.body.username,role:"Agent"},req.body.password,function(err,user){
if(err){
  console.log(err);
  res.redirect("/register");
}else{
  passport.authenticate("local")(req,res,function(){
    res.redirect("/secrets")
  })
}
})
}
}else if(req.body.role === "Admin"){
  if(req.body.key===process.env.AdminKey){
  User.register({username:req.body.username,role:"Admin"},req.body.password,function(err,user){
if(err){
  console.log(err);
  res.redirect("/register");
}else{
  passport.authenticate("local")(req,res,function(){
    res.redirect("/secrets")
  })
}
})
}
}
})

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      })
    }
  })
})

app.listen(3000,function(req,res){
  console.log("server up at 3000")
})
