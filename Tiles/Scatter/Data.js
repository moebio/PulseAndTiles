//the embeder calls this function to send data
receiveData = function(dataObj){
  switch(dataObj.type){
    case "data":
      setData(dataObj.value)
      break
    case "colors":
      setColors(dataObj.value)
      break
    case "labels":
      setLabels(dataObj.value)
      break
    case "sizes":
      setSizes(dataObj.value)
      break
    case "configuration":
      setConfiguration(dataObj.value)
      break
  }
  resize()
}

//optional:
askData = function(type){
  switch(type){
    
  }
}

setData = function(data){
  valuesX = data[0]
  valuesY = data[1]

  if(valuesX.type=="sL" && _isPotentialDateList(valuesX)) valuesX = _.toDateList(valuesX)
  if(valuesY.type=="sL" && _isPotentialDateList(valuesY)) valuesY = _.toDateList(valuesY)
  if(valuesX.type!="nL") valuesX = valuesX.toNumberList()
  if(valuesY.type!="nL") valuesY = valuesY.toNumberList()

  valuesXN = valuesX.getNormalized()
  valuesYN = valuesY.getNormalized()

  if(configuration.logX) valuesXN = _.tonL(valuesXN.map(v=>Math.log(v+0.1))).getNormalized()
  if(configuration.logY) valuesYN = _.tonL(valuesYN.map(v=>Math.log(v+0.1))).getNormalized()
}

/**
To be Done weel, and placed into assembled
**/
_isPotentialDateList = function(list){
  return list[0].includes(":") || list[0].includes("/") || list[0].includes("|")
}

setColors = function(data){
  colors = data
  if(colors.type=="nL") colors = colors.toColorList()
}

setLabels = function(data){
  labels = data
}

setSizes = function(data){
  sizes = data.getNormalized()
}

setConfiguration = function(confObject){
  _.deepAssign(configuration, confObject)
  k.setBackgroundColor(configuration.backgroundColor)
}

//this function will be overriden by the emebeder, so the module can send data to the embedder
sendData = function(){}