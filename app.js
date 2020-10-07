require('dotenv').config()
const express = require("express")
const app = express();
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const Loan = require("loanjs").Loan
const saltRounds = 10;



app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))
app.set('view engine','ejs')

mongoose.connect("mongodb://localhost:27017/loanDB",{ useNewUrlParser: true,useUnifiedTopology: true });

const adminSchema = new mongoose.Schema({
  role:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  }
  // ,
  // key:{
  //   type:String,
  //   required:true
  // }
})

const agentsSchema = new mongoose.Schema({
  role:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  }
  // ,
  // key:{
  //   type:String,
  //   required:true
  // }
})

const customersSchema = new mongoose.Schema({
  role:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  }
})

const Admin = new mongoose.model("Admin",adminSchema);
const Agent = new mongoose.model("Agent",agentsSchema);
const Customer = new mongoose.model("Customer",customersSchema);

var loan = new Loan(200000,24,20);
console.log(loan.installments[0].installment);

app.get("/",function(req,res){
  res.render("home");
})

app.get("/:loc",function(req,res){
  switch (req.params.loc) {
    case "home": res.render("home");
    break;
    case "login": res.render("login");
    break;
    case "register": res.render("register");
    break;
    default: res.render("home")
  }
})

app.post("/register",function(req,res){
  const role = req.body.role;
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const key = req.body.key;

  if(role === "Customer"){
    bcrypt.hash(password, saltRounds, function(err, hash){
      const newCustomer = new Customer({role:role,name:name,email:email,password:hash})
      newCustomer.save(function(err){
        if(err){console.log(err)}else{res.render("home")}
      });
    })
  }else if(role === "Agent"){
      bcrypt.hash(password, saltRounds, function(err,hash){
        const newAgent = new Agent({role:role,name:name,email:email,password:hash})
        newAgent.save(function(err){
          if(err){console.log(err)}else{res.render("home")}
        });
      })
  }else if(role === "Admin"){
      bcrypt.hash(password, saltRounds, function(err,hash){
        const newAdmin = new Admin({role:role,name:name,email:email,password:hash})
        newAdmin.save(function(err){
          if(err){console.log(err)}else{res.render("home")}
        });
      })
  }
})

app.post("/login",function(req,res){
  const role = req.body.role;
  const email = req.body.email;
  const password = req.body.password;
  const key = req.body.key;

  if(role === "Customer")
  {
    Customer.findOne({email:email},function(err,foundOne){
      if(err){console.log(err)}
      else
      {
        if(foundOne){
          bcrypt.compare(password,foundOne.password,function(err,result){
            if(result === true){
              res.render("home")
            }else{console.log("Wrong Password")}
          })
        }else{ res.send("<p>user does not exist</p>") }
      }
    })
  }
  else if(role === "Agent")
  {
    Agent.findOne({email:email},function(err,foundOne){
      if(err){console.log(err)}
      else
      {
        if(foundOne){

            if(key===process.env.AgentKey){
              bcrypt.compare(password,foundOne.password,function(err,result){
                if(err){console.log(err)}else{if(result===true){
                  res.render("home")
                }}
              })
            }else{res.send("<p>wrong key</p>")}

        }else{  res.send("<p>user does not exist</p>")  }
      }
    })
  }
  else if(role === "Admin")
  {
    Admin.findOne({email:email},function(err,foundOne){
      if(err){console.log(err)}
      else
      {
        if(foundOne){

            if(key===process.env.AdminKey){
              bcrypt.compare(password,foundOne.password,function(err,result){
                if(result===true){
                  res.render("home")
                }
              })
            }

        }else{  res.send("<p>user does not exist</p>")  }
      }
    })
  }
})


app.listen(3000,function(req,res){
  console.log("server up at 3000")
})
