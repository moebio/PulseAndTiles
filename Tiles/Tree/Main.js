let k
let TREE
let overNode
let overRect
let frame

let kx = ky = 1
let x0 = y0 = 0
let kxL = kyL = 1
let x0L = y0L = 0

let speed = 0

let M = 20

init=function(){
  k = new _.MetaCanvas({
    cycle,
    resize
  })
  frame = new _.Rec(0, 0, k.W, k.H)
  resize()
  // k.setZOOMABLE(true)
  // k.setDRAGGABLE(true)
}

cycle=function(){
  if(!TREE) return

  overNode = null

  drawNode(TREE.nodes[0], frame)

  if(overNode && k.MOUSE_UP){
    kxL = frame.width/overNode.rectangle.width
    kyL = frame.height/overNode.rectangle.height
    x0L = -overNode.rectangle.x*kxL+frame.x
    y0L = -overNode.rectangle.y*kyL+frame.y

    speed = 0
  }
  speed = (kxL<kx?0.98:0.998)*speed + (kxL<kx?0.02:0.002)
  kx=(1-speed)*kx+speed*kxL
  ky=(1-speed)*ky+speed*kyL
  x0=(1-speed)*x0+speed*x0L
  y0=(1-speed)*y0+speed*y0L
}


resize = function(){
  //k.W, k.H
  if(!TREE) return
  frame = new _.Rec(M, M, k.W-2*M, k.H-2*M)
  assignRect(TREE.nodes[0], frame)
}

assignRect = function(node, rect){
  let m=1
  let m2=0.4
  let textH = 12//Math.min(rect.width,rect.height)*0.12
  node.rectangle = rect
  let rects = _.squarify(new _.Rec(rect.x+m, rect.y+m+textH, rect.width-2*m, rect.height-2*m-textH), node.sonsWeightsN)
  node.to.forEach((son,i)=>{
    assignRect(son, new _.Rec(rects[i].x+m2,rects[i].y+m2,rects[i].width-2*m2,rects[i].height-2*m2))
  })
}





window.addEventListener("load", function() {  
  init()
})