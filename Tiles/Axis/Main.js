let k


//config
// let MODE = 1//0: stripes, 1:circles
// let rCircles = 3
// let marginCircles = 1
// let backgroundColor = 'rgb(240,240,240)'

let configuration = {
  mode:1,//0: stripes, 1:circles
  rCircles:3,
  marginCircles:1,
  backgroundColor:'rgb(255,255,255)',
  margin:20
}


let valuesN
let circles

let dates
let datesInterval

let colors
let labels
let sizes

//let rCircles2 = configuration.rCircles**2

let overIndex

let x0Selection = x1Selection = 0
let minSelection = maxSelection = 0
let selecting = false
let indexesSelected

init=function(){
  k = new _.MetaCanvas({
    cycle,
    resize
  })
  k.setBackgroundColor(configuration.backgroundColor)
}

cycle=function(){
  if(!valuesN) return

  draw()
}

resize = function(){
  //k.W, k.H
  if(configuration.mode==1){
    calculateCirclesPositions()
  }
}




//circles

calculateCirclesPositions = function(){
  if(!valuesN) return
  
  circles = new _.L()
  let m = configuration.margin
  let dx = k.W-2*m
  valuesN.forEach((v,i)=>{
    let x = m + v*dx
    let r = sizes?sizes[i]*configuration.rCircles:configuration.rCircles
    let y = positionInX(x, r)
    circles.push({x, y, r})
  })
}
positionInX = function(x, r){
  let y0 = y = 0
  let jump = 5
  let sign = 1
  let n = 1
  while(collision(x,y,r)){
    y=y0+n*sign*jump
    sign*=-1
    if(sign) n++
  }
  return y
}
collision = function(x,y,r){
  for(var i=0; i<circles.length; i++){
    if( (circles[i].x-x)**2 + (circles[i].y-y)**2 < (circles[i].r+r+configuration.marginCircles)**2 ) return true
  }
  return false
}




window.addEventListener("load", function() {  
  init()
})