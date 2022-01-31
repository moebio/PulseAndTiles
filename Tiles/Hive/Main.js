import '../../pulse.js'
import HiveView from '../../Views/HiveView.js'

export default class Hive{

  constructor(){
    this.config = {
      physics:{
        k:0.01,
        dEqSprings:60,
        dEqRepulsors:150
      },
      interaction:{
        nodes_zoom:'static'
      }
    }

    this.k = new _.MetaCanvas({
      cycle:this.cycle.bind(this)
    })
    
    this.view = new HiveView(this.k, this.receiveDataFromView.bind(this))
  }

  receiveDataFromView(ob){
    //console.log("receiveDataFromView:", ob)
    this.sendData(ob)
  }

  cycle(){
    this.view?.draw()
  }

  receiveData(dataObj){
    this.view.receiveData(dataObj)
  }

  ////////////////////////////////////////////////

  //will be overriden by however loads the module
  sendData(){}

}

var hive = new Hive()

//window.receiveData = net.receiveData
window.instance = hive









// init=function(){
//   k = new _.MetaCanvas({
//     cycle
//   })

//   view = new Hive(k, receiveDataFromView, config)
// }

// receiveDataFromView = function(ob){
//   sendData(ob)
// }

// cycle=function(){
//   view?.draw()
// }

// receiveData = function(dataObj){
//   console.log("👉 [Hive] receiveData:", dataObj)
//   view.receiveData(dataObj)
// }

// ////////////////////////////////////////////////

// //will be overriden by however loads the module
// sendData = function(){}


// window.addEventListener("load", function() {  
//   init()
// })