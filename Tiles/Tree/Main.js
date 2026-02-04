let k
let TREE
let overNode
let overRect
let frame
let nLevels

let kx = ky = 1
let x0 = y0 = 0
let kxL = kyL = 1
let x0L = y0L = 0

let speed = 0

let M = 20

let TEXT_AREA_PROPORTION = 0.1

let following = true

let SELECTED_NODES = []
let prevOverNode

let weights

let MODE = "navigation"//"treemap"//

let fontName = "Arial"

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

  let prevOverNode = overNode
  overNode = null

  switch(MODE){
    case "treemap":
      cycleTreemap()
      break
    case "navigation":
      cycleNavigation()
      //cycleNavigation()
      break
  }

  if(prevOverNode!=overNode && mouse_in_tile){
    if(overNode){
      sendData({type:'over', value:overNode})
    } else {
      sendData({type:'out', value:null})
    }
  }
}


//////////////////////////////
let prevMX, prevMY
let xByLevel
let dx=1
//let x0 = 10
cycleNavigation=function(){
  // prevMX = k.mX
  // prevMY = k.mY

  xByLevel = new _.nL();
  xByLevel[0] = k.W/TREE.nLevels;

  dx = k.W/TREE.nLevels

  if(!mouse_in_tile){
    let mXF = externalOverNode?(externalOverNode.level+0.5)*dx:dx*0.3
    k.mX = 0.9*k.mX + 0.1*mXF
  }

  drawNodeNavigation(TREE.nodes[0], y0, k.H)

  for(var i=0; i<TREE.nLevels; i++){
    if(xByLevel[i]==null){
      xByLevel[i] = xByLevel[i-1] + (k.W - xByLevel[i-1])/(TREE.nLevels-i);
    }
  }
}

//////////////////////////////
cycleTreemap=function(){
  
  ///zoom
  if(k.WHEEL_CHANGE!=0){
    following = false
    let zoomChange = 1 + 0.3*k.WHEEL_CHANGE
    if( ((kx>=100 || ky>=100) &&  zoomChange>1) || ((kx<=1 || ky<=1) &&  zoomChange<1) ) zoomChange = 1
    if(k.mX>0) kx *= zoomChange
    if(k.mY>0) ky *= zoomChange
    // kx = Math.min(Math.max(kx, 1), 10)
    // ky = Math.min(Math.max(ky, 1), 10)
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
  switch(MODE){
    case "treemap":
      assignRectTreemap(TREE.nodes[0], frame)
      break
    case "navigation":
      assignRectNavigation(TREE.nodes[0], new _.Rec(M, M, (k.W-2*M)/TREE.nLevels, k.H-2*M))
      break
  }
}

assignRectNavigation = function(node, rect){
  node.rectangle = rect
  let y = rect.y
  node.to.forEach((son,i)=>{
    const nWeight = node.sonsWeightsN[i]
    const h = nWeight*rect.height
    assignRectNavigation(son, new _.Rec(rect.x+rect.width, y  , rect.width, h))
    y+=h
  })

  // let rects = _.squarify(new _.Rec(rect.x+mx, rect.y+my+textH, rect.width-2*mx, rect.height-2*my-textH), node.sonsWeightsN)
  // node.to.forEach((son,i)=>{
  //   assignRectTreemap(son, new _.Rec(rects[i].x+m2,rects[i].y+m2,rects[i].width-2*m2,rects[i].height-2*m2))
  // })
}

assignRectTreemap = function(node, rect){
  let m=1
  let m2=0//0.4

  let mx = rect.width*0.015
  let my = rect.height*0.015

  let textH = rect.height*TEXT_AREA_PROPORTION
  node.rectangle = rect
  let rects = _.squarify(new _.Rec(rect.x+mx, rect.y+my+textH, rect.width-2*mx, rect.height-2*my-textH), node.sonsWeightsN)
  node.to.forEach((son,i)=>{
    assignRectTreemap(son, new _.Rec(rects[i].x+m2,rects[i].y+m2,rects[i].width-2*m2,rects[i].height-2*m2))
  })
}



window.addEventListener("load", function() {  
  init()
})