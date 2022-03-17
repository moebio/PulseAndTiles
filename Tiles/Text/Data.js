receiveData = function(dataObj){
  switch(dataObj.type){
    case "data":
      setData(dataObj.value)
      break
    case "highlight":
      setHighlight(dataObj.value)
      break
    case "configuration":
      setConfiguration(dataObj.value)
      break
    case "css":
      textArea.setCSS(dataObj.value)
      break
  }
}


setHighlight = function(highlightObject){
  let tokens = highlightObject.tokens
  let colors = highlightObject.colors

  transformedText = basicTransformation(text)

  let css = ".overall{font-family: Arial, Helvetica, sans-serif;color: rgb(0,0,0); }"

  document.overSpanFunction = function(txt){
    sendData({type:"over", value:txt})
  }
  document.upSpanFunction = function(txt){
    sendData({type:"mouseup", value:txt})
  }
  document.leaveSpanFunction = function(txt){
    sendData({type:"leave", value:txt})
  }

  tokens.forEach((token,i)=>{
    let kind = "k_"+i
    let color = colors?colors[i]:"rgb(230, 230, 230)"
    css+="."+kind+"{font-family: Arial, Helvetica, sans-serif; font-size: 110%; background-color: "+color+"; color: rgb(0,0,0); cursor: pointer;} "//+kind+":hover{cursor: pointer;}"
    //let newToken = "<span class=\""+ kind +"\" onmouseover=\"overSpanFunction('"+token+"')\" onmouseup=\"upSpanFunction('"+token+"')\" onmouseleave=\"leaveSpanFunction('"+token+"')\">"+ token + "</span>"
    let tokenRegEx = new RegExp("\\s("+token+")(\\s|\\.|\\,|\\:|\\;)", "gi")
    transformedText = transformedText.replace(tokenRegEx, " <span class=\""+ kind +"\" onmouseover=\"overSpanFunction('"+token+"')\" onmouseup=\"upSpanFunction('"+token+"')\" onmouseleave=\"leaveSpanFunction('"+token+"')\">$1</span>$2")
  })

  textArea.setCSS(css)
  textArea.setData(transformedText)
}

setData = function(data){
  text = data
  transformedText = basicTransformation(text)
  textArea.setData(text)
}

basicTransformation = function(text){
  let css = ".overall{font-family: Arial, Helvetica, sans-serif;color: rgb(0,0,0);}"
  textArea.setCSS(css)
  return text.replaceAll("\n", "<br>")
}

setConfiguration = function(confObject){

}

//this function will be overriden by the emebeder, so the module can send data to the embedder
sendData = function(){}