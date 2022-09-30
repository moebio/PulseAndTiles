import HtmlArea from '../../Elements/HtmlArea.js'

export default class Text{

  constructor(){
    this.textArea
    this.text
    this.transformedText

    this.MARGIN = 8

    this.buildTextPanel()
    this.resize()

    // this.configuration = this.defaultConfiguration = {
    //   input:false
    // }

    document.body.style = "background-color:rgb(240,240,240)"
    window.addEventListener("resize", this.resize)
  }

  buildTextPanel = function(){
    if(this.textArea) return

    this.textArea = new HtmlArea(cb=>{console.log("HtmlArea cb:",cb)})
    
    let css = ".overall{font-family: Arial, Helvetica, sans-serif;color: rgb(0,0,0);}"
    this.textArea.setCSS(css)
  }

  resize = function(){
    this.textArea?.setDimensions(this.MARGIN, this.MARGIN, window.innerWidth-2*this.MARGIN, window.innerHeight-2*this.MARGIN)
  }

  ///////// Data

  receiveData = function(dataObj){
    switch(dataObj.type){
      case "data":
        this.setData(dataObj.value)
        break
      case "highlight":
        this.setHighlight(dataObj.value)
        break
      case "configuration":
        this.setConfiguration(dataObj.value)
        break
      case "css":
        this.textArea.setCSS(dataObj.value)
        break
    }
  }


  setHighlight = function(highlightObject){
    let tokens = highlightObject.tokens
    let colors = highlightObject.colors

    this.transformedText = this.basicTransformation(this.text)

    let css = ".overall{font-family: Arial, Helvetica, sans-serif;color: rgb(0,0,0); }"

    document.overSpanFunction = function(txt){
      this.sendData({type:"over", value:txt})
    }
    document.upSpanFunction = function(txt){
      this.sendData({type:"mouseup", value:txt})
    }
    document.leaveSpanFunction = function(txt){
      this.sendData({type:"leave", value:txt})
    }

    tokens.forEach((token,i)=>{
      let kind = "k_"+i
      let color = colors?colors[i]:"rgb(230, 230, 230)"
      css+="."+kind+"{font-family: Arial, Helvetica, sans-serif; font-size: 110%; background-color: "+color+"; color: rgb(0,0,0); cursor: pointer;} "//+kind+":hover{cursor: pointer;}"
      //let newToken = "<span class=\""+ kind +"\" onmouseover=\"overSpanFunction('"+token+"')\" onmouseup=\"upSpanFunction('"+token+"')\" onmouseleave=\"leaveSpanFunction('"+token+"')\">"+ token + "</span>"
      let tokenRegEx = new RegExp("\\s("+token+")(\\s|\\.|\\,|\\:|\\;)", "gi")
      this.transformedText = this.transformedText.replace(tokenRegEx, " <span class=\""+ kind +"\" onmouseover=\"overSpanFunction('"+token+"')\" onmouseup=\"upSpanFunction('"+token+"')\" onmouseleave=\"leaveSpanFunction('"+token+"')\">$1</span>$2")
    })

    this.textArea.setCSS(css)
    this.textArea.setData(this.transformedText)
  }

  setData = function(data){
    this.text = data
    this.transformedText = this.basicTransformation(this.text)
    this.textArea.setData(this.text)
  }

  basicTransformation = function(text){
    let css = ".overall{font-family: Arial, Helvetica, sans-serif;color: rgb(0,0,0);}"
    this.textArea.setCSS(css)
    return this.text.replaceAll("\n", "<br>")
  }

  setConfiguration = function(confObject){
    // this.configuration = Object.assign(this.defaultConfiguration)//config?Object.assign(NetView.defaultConfig, config):NetView.defaultConfig
    // _.deepAssign(this.configuration, confObject)
  }

  //this function will be overriden by the emebeder, so the module can send data to the embedder
  sendData = function(){}
  

  // window.addEventListener("load", function() {  
  //   init()
  // })
}

var text = new Text()

//window.receiveData = net.receiveData
window.instance = text