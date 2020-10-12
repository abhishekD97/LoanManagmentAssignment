var a = document.getElementById("role")
var keyHTML = document.getElementById("key")
a.addEventListener("change",function(){
  var value = a.value;
  if(value==="Customer"){
    keyHTML.style.display = "none";
  }else if(value==="Agent"){
    keyHTML.style.display = "block"
  }else if(value==="Admin"){
    keyHTML.style.display = "block";
  }
});
