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

let TEXT_AREA_PROPORTION = 0.1

let following = true

let SELECTED_NODES = []

init=function(){
  k = new _.MetaCanvas({
    cycle,
    resize
  })
  this.k = k
  frame = new _.Rec(0, 0, k.W, k.H)
  resize()
  // k.setZOOMABLE(true)
  // k.setDRAGGABLE(true)
}

cycle=function(){
  if(!TREE) return

  overNode = null


  ///zoom
  if(k.WHEEL_CHANGE!=0){
    following = false
    let zoomChange = 1 + 0.3*k.WHEEL_CHANGE
    if(k.mX>0) kx *= zoomChange
    if(k.mY>0) ky *= zoomChange
    kx = Math.min(Math.max(kx, 1), 10)
    ky = Math.min(Math.max(ky, 1), 10)
    if(k.mX>0) x0 = (x0 - k.mX )*zoomChange + k.mX
    if(k.mY>0) y0 = (y0 - k.mY )*zoomChange + k.mY
  }
  if(k.MOUSE_PRESSED){
    following = false
    x0+=k.DX_MOUSE_PRESSED
    y0+=k.DY_MOUSE_PRESSED
  }
  if(!following){
    x0=Math.min(x0,0)
    y0=Math.min(y0,0)
  }
  ///


  drawNode(TREE.nodes[0], frame)

  if(k.MOUSE_UP_FAST){
    let nodeToGo = overNode||TREE.nodes[0]

    if(k.COMMAND_PRESSED){
      if(SELECTED_NODES.includes(nodeToGo)){
        SELECTED_NODES = SELECTED_NODES.filter(n=>n!=nodeToGo)
      } else {
        SELECTED_NODES.push(nodeToGo)
      }
      sendData({type:'selectedMultiple', value:SELECTED_NODES})
    } else {
      following = true  
      kxL = frame.width/nodeToGo.rectangle.width
      kyL = frame.height/nodeToGo.rectangle.height
      x0L = -nodeToGo.rectangle.x*kxL+frame.x
      y0L = -nodeToGo.rectangle.y*kyL+frame.y
      speed = 0
      if(SELECTED_NODES.length==0) sendData({type:'selected', value:nodeToGo})
    }
    
  }

  if(following){
    speed = (kxL<kx?0.98:0.998)*speed + (kxL<kx?0.02:0.002)
    kx=(1-speed)*kx+speed*kxL
    ky=(1-speed)*ky+speed*kyL
    x0=(1-speed)*x0+speed*x0L
    y0=(1-speed)*y0+speed*y0L
  }
}


resize = function(){
  //k.W, k.H
  if(!TREE) return
  frame = new _.Rec(M, M, k.W-2*M, k.H-2*M)
  assignRect(TREE.nodes[0], frame)
}

assignRect = function(node, rect){
  let m=1
  let m2=0//0.4

  let mx = rect.width*0.015
  let my = rect.height*0.015

  let textH = rect.height*TEXT_AREA_PROPORTION
  node.rectangle = rect
  let rects = _.squarify(new _.Rec(rect.x+mx, rect.y+my+textH, rect.width-2*mx, rect.height-2*my-textH), node.sonsWeightsN)
  node.to.forEach((son,i)=>{
    assignRect(son, new _.Rec(rects[i].x+m2,rects[i].y+m2,rects[i].width-2*m2,rects[i].height-2*m2))
  })
}



window.addEventListener("load", function() {  
  init()
})