//the embeder calls this function to send data

let mouse_in_tile = true

receiveData = function(dataObj){
  switch(dataObj.type){
    case "data":
      setData(dataObj.value)
      break
    case "weights":
      setWeights(dataObj.value)
      break
    case "background_color":
      //background_color = dataObj.value
      k.setBackgroundColor(dataObj.value)
      break
    case "nodes_color":
      //background_color = dataObj.value
      nodes_color = dataObj.value
      break
    case "text_color":
      //background_color = dataObj.value
      text_color = dataObj.value
      break
    case "distortion":
      DISTORTION__POWER = dataObj.value
      break
    case "configuration":
      setConfiguration(dataObj.value)
      break
    case "over":
    case "out":
      setOverNode(dataObj.value)
      break
    case "mouse_out_tile":
      //k.mY = -1000
      mouse_in_tile = false
      break
    case "mouse_over_tile":
      //k.mY = -1000
      mouse_in_tile = true
      break
  }
}

//optional:
askData = function(type){
  switch(type){
    
  }
}



setData = function(data){
  TREE = data
  TREE.assignDescentWeightsToNodes()
  assignWeightsAndRectangles(TREE)

  TREE.nodes.forEach(node=>{
    node.fW = node.descentWeight + 5
  })

  resize()
}

setWeights = function(weights){
  this.weights = weights

  TREE.getLeaves().forEach(leaf=>{

  })
}

assignWeightsAndRectangles = function(tree){
  let father = tree.nodes[0]
  // father._rec = new _.Rec(0,0,1,1)

  assignSonsWeights(father)


  // tree.nodes.forEach(n=>{
  //   console.log(" ".repeat(n.level)+" "+n.name+" "+n.weight+" ["+n.sonsWeightsN?.join(",")+"]")
  // })
}

assignSonsWeights = function(node){
  if(node.to.length==0) return
  node.sonsWeights = new _.nL()
  node.sonsWeightsN = new _.nL()
  node.to.forEach(son=>{
    node.sonsWeights.push(son.weight)
    node.sonsWeightsN.push(son.weight/node.weight)
    assignSonsWeights(son)
  })
  //let weights = 
  //node.to.for
}

setConfiguration = function(confObject){

}

//this function will be overriden by the emebeder, so the module can send data to the embedder
sendData = function(){}