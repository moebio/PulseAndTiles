//the embeder calls this function to send data
receiveData = function(dataObj){
  switch(dataObj.type){
    case "data":
      setData(dataObj.value)
      break
    case "configuration":
      setConfiguration(dataObj.value)
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
  resize()
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