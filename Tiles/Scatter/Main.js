let k

let configuration = {
  backgroundColor:'rgb(255,255,255)',
  margin:20,
  logX:false,
  logY:false
}

let valuesX
let valuesY
let valuesXN
let valuesYN

let colors
let labels
let sizes

//let rCircles2 = configuration.rCircles**2

let overIndex

init=function(){
  k = new _.MetaCanvas({
    cycle,
    resize
  })
  k.setBackgroundColor(configuration.backgroundColor)
}

cycle=function(){
  if(!valuesXN) return

  draw()
}

resize = function(){
  
}


window.addEventListener("load", function() {  
  init()
})