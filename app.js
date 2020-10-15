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
const Loan = require("loanjs").Loan;
var cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended:false}))
app.use(express.static("public"))
app.set('view engine','ejs')
app.use(cookieParser())

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

const loansSchema = new mongoose.Schema({
  principalAmount:Number,
  tenure:Number,
  interest:Number,
  status:String
})

const LoanObject = new mongoose.model("LoanObject", loansSchema);

const usersSchema = new mongoose.Schema({
  role:String,
  email:String,
  password:String,
  loanPlan:[{  principalAmount:Number,
    tenure:Number,
    interest:Number,
    status:String}]
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

app.get("/",function(req,res){
  res.render("home")
})

app.get("/home", function(req, res) {
  res.render("home")
})

app.get("/login",function(req,res){
  res.render("login")
})

app.get("/register",function(req,res){
  res.render("register")
})

app.get("/secrets", function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets",{loan:req.user.loanPlan})
  }else{
    res.redirect("/login")
  }
})

app.get("/secretsAgent/editPlan",function(req,res){
  res.render("editPlan")
})

app.get("/secretsAgent", function(req,res){
  if(req.isAuthenticated()){
    User.find({role:"Customer"},function(err,found){
      if(err) return console.log(err);
      else{
        res.render("secretsAgent",{customers:found})
      }
    })
  }else{
    res.redirect("/login")
  }
})

app.get("/secretsAdmin", function(req,res){
  if(req.isAuthenticated()){
    res.render("secretsAdmin")
  }else{
    res.redirect("/login")
  }
})

// app.get("/secrets/planDetails",function(req,res){
//   if(req.isAuthenticated()){
//     res.render("planDetails")
//   }else{
//     res.redirect("/login")
//   }
// })

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
    res.redirect("/secretsAgent")
  })
}
})
}else return res.send("Wrong Key")
}else if(req.body.role === "Admin"){
  if(req.body.key===process.env.AdminKey){
  User.register({username:req.body.username,role:"Admin"},req.body.password,function(err,user){
if(err){
  console.log(err);
  res.redirect("/register");
}else{
  passport.authenticate("local")(req,res,function(){
    res.redirect("/secretsAdmin")
  })
}
})
}else return res.send("Wrong Key")
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
        if(req.user.role==="Customer"){
          res.redirect("/secrets");
        }else if(req.user.role==="Agent"){
          res.redirect("/secretsAgent");
        }else if(req.user.role==="Admin"){
          res.redirect("/secretsAdmin");
        }
      })
    }
  })
})

app.post("/secrets",function(req,res){
  if(req.isAuthenticated()){
    const p = req.body.principalAmount;
    const t = req.body.tenure;
    const i = req.body.interestRate;
    const loan = new Loan(p,t,i);
    const loanInputs = {
      p:p,
      t:t,
      i:i
    }
    // console.log(installments)
    res.render("planDetails",{loan:loan,loanInputs:loanInputs})
  }else{
    res.redirect("/login")
  }
})

app.post("/secretsAgent", function(req,res){
  if(req.isAuthenticated()){
    const username = req.body.username;
    User.findOne({username:username},function(err,foundOne){
      res.render("secretsAgent",{loan:foundOne.loanPlan})
    })

  }else{
    res.redirect("/login")
  }
})

app.post("/planDetails",function(req,res){
  if(req.isAuthenticated()){
    const p = req.body.p;
    const t = req.body.t;
    const i = req.body.i;
    const newLoan = new LoanObject({
      principalAmount:p,
      tenure:t,
      interest:i,
      status:"New"
    })
    newLoan.save();
    User.findOneAndUpdate({username:req.user.username},{$push:{loanPlan:newLoan}},function(error,success)
    {
      if(error){
      console.log(error)
    }else{
      console.log("successfully updated loan plan")
      res.redirect("/secrets")
    }
  })
  }else{
    res.redirect("/login")
  }
})

app.listen(3000,function(req,res){
  console.log("server up at 3000")
})
