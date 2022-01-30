let k

let texts
let titles
let dates
let colors

let boxes
let maxY

let marginBox = 12
let marginText = 10

let y0 = 0
let positionsFromIndex
let indexDestiny
let indexesFilter

let overBox

init=function(){
  k = new _.MetaCanvas({
    cycle,
    resize
  })
}

cycle=function(){
  if(!texts) return
  //draw()

  
  //y0 = 0.95*y0 + 0.05*(-k.mY*(maxY-k.H)/k.H)

  if(k.DY_MOUSE_PRESSED!=0){
    y0+=k.DY_MOUSE_PRESSED
    indexDestiny = null
  }
  if(k.WHEEL_CHANGE!=0){
    y0+=100*k.WHEEL_CHANGE
    indexDestiny = null
  }

  if(indexDestiny!=null){
    y0 = 0.9*y0 + 0.1*(-positionsFromIndex[indexDestiny]+marginBox)
  }

  y0 = Math.max(Math.min(y0, 5), -(maxY-k.H+20))


  let y = y0
  let isDestiny
  let isOver
  previousOverBox = overBox
  overBox = null
  boxes.forEach((b,i)=>{
    if(indexesFilter && !indexesFilter.includes(i)) return
    b.yDestiny = y
    b.yFollow = 0.9*b.yFollow + 0.1*b.yDestiny
    isDestiny = i==indexDestiny
    isOver = drawBox(b, b.yFollow, isDestiny, colors?.[i])
    if(isOver) overBox = b
    if(isDestiny) positionsFromIndex[indexDestiny] = y - y0
    y += b.height+marginBox
  })

  if(previousOverBox!=overBox) sendData({value:overBox, type:"over"})


  //maxY = y

  let h = maxY//-y0
  let hscroll = k.H*k.H/h

  //scroll
  k.fill('rgb(30,30,30)')
  k.fRect(k.W-marginBox*0.5-3, -k.H*y0/h, 6, hscroll)

  if(k.mX>k.W-marginBox){
    if(k.MOUSE_PRESSED){
      y0 = -k.mY*(maxY-50-k.H)/k.H + 10
      indexDestiny = null
    }
  }
  if(k.MOUSE_UP_FAST) indexesFilter = null
}

drawBox = function(box, y, isIndexDestiny, color){
  if(y+box.height<0 || y>k.H) return

  k.fill(color||'rgb(230,230,230)')
  let over = k.fRectM(marginBox, y, k.W-2*marginBox, box.height)

  if(over || isIndexDestiny){
    k.stroke('black', 2)
    k.sRect(marginBox, y, k.W-2*marginBox, box.height)
  }

  if(box.title){
    k.setText('black', 12, null, null, null, 'bold')
    k.fTextWidth(box.title, marginBox+marginText, y+marginText, k.W-2*marginBox-2*marginText, 14)
    y+=box.heightTitle
  }

  k.setText('black', 12)
  k.fTextWidth(box.text, marginBox+marginText, y+marginText, k.W-2*marginBox-2*marginText, 14)

  return over
}

resize = function(){
  console.log("rs:", k.W, k.H)
  //k.W, k.H
  prepareBoxes()
}

prepareBoxes = function(){
  if(!texts) return

  positionsFromIndex = new _.nL()

  boxes = new _.L()

  let y = marginBox
  
  
  texts.forEach((t,i)=>{
    t = (t??"").trim()
    let title = (titles?titles[i]:"").trim()
    k.setText('black', 12)
    let nLines
    nLines = k.nLines(t, k.W-2*marginBox-2*marginText)
    k.setText('black', 12, null, null, null, 'bold')
    let nLinesTitle = k.nLines(title, k.W-2*marginBox-2*marginText)
    
    let heightTitle = title?((nLinesTitle-1)*14 + 2*marginText):0
    let height = (nLines-1)*14+2*marginBox+marginText+heightTitle

    positionsFromIndex[i] = y
    
    boxes.push({
      text:t,
      title,
      y,
      yFollow:y,
      height,
      heightTitle,
      index:i
    })

    y+=height+marginBox
  })

  maxY=y

}





window.addEventListener("load", function() {  
  init()
})