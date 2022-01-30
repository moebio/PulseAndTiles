//the embeder calls this function to send data
receiveData = function(dataObj, preventPrepareBoxes){
  if(Array.isArray(dataObj)){
    dataObj.forEach(dO=>receiveData(dO, true))
    prepareBoxes()
    return
  }

  switch(dataObj.type){
    case "data":
      setData(dataObj.value)
      break
    case "titles":
      setTitles(dataObj.value)
      break
    case "dates":
      setDates(dataObj.value)
      break
    case "colors":
      setColors(dataObj.value)
      break
    case "index":
      setIndex(dataObj.value)
      preventPrepareBoxes=true
      break
    case "indexes":
      setIndexes(dataObj.value)
      preventPrepareBoxes=true
      break
    case "configuration":
      setConfiguration(dataObj.value)
      break
  }
  if(!preventPrepareBoxes) prepareBoxes()
}

//optional:
askData = function(type){
  switch(type){
    
  }
}

setIndex = function(index){
  indexDestiny = index
  indexesFilter = null
}

setIndexes = function(indexes){
  indexesFilter = indexes
  indexDestiny = null
  y0 = 0
}

setData = function(data){
  texts = data
  y0 = 0
}

setTitles = function(data){
  titles = data
}

setDates = function(data){
  dates = data
}

setColors = function(data){
  colors = data
}

setConfiguration = function(confObject){

}

//this function will be overriden by the emebeder, so the module can send data to the embedder
sendData = function(){}