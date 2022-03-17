let textArea
let text, transformedText

let MARGIN = 8

init=function(){
  buildTextPanel()
  resize()
  document.body.style = "background-color:rgb(240,240,240)"
}

buildTextPanel = function(){
  if(textArea) return

  textArea = new HtmlArea(cb=>{console.log("HtmlArea cb:",cb)})
  console.log("textArea", textArea)
  
  let css = ".overall{font-family: Arial, Helvetica, sans-serif;color: rgb(0,0,0);}"
  textArea.setCSS(css)

  //window.scope = this
}

resize = function(){
  textArea.setDimensions(MARGIN, MARGIN, window.innerWidth-2*MARGIN, window.innerHeight-2*MARGIN)
}

window.addEventListener("resize", resize)

window.addEventListener("load", function() {  
  init()
})