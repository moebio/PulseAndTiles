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
  let values = data
  if(values.type=="sL" && _isPotentialDateList(values)) values = _.toDateList(values)
  if(values.type=="dL"){
    dates = values
    datesInterval = dates.getInterval()
    values = values.toNumberList()
  } else {
    datesInterval = null
  }

  valuesN = values.getNormalized()
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
  console.log("configuration.backgroundColor", configuration.backgroundColor)
  k.setBackgroundColor(configuration.backgroundColor)
  calculateCirclesPositions()
}

//this function will be overriden by the emebeder, so the module can send data to the embedder
sendData = function(){}