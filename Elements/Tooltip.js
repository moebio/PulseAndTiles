import Element from './Element.js'

export default class Tooltip extends Element{

	/////////////////////////////////////////constructor
	constructor(k, callBackSendData, config={font_size:16, marginW:10, marginH:6, fixedWidth:200}){
		super(k, callBackSendData, config)

		this.text
		this.W
		this.H
	}

	setData(text){
		this.text = text
		this.k.setText('white', this.config.font_size)
		if(this.config.fixedWidth){
			this.W = this.config.fixedWidth
			let nLines = this.k.nLines(text, this.config.fixedWidth-2*this.config.marginW)
			this.H = nLines*this.config.font_size + 2*this.config.marginH
		} else {
			let w = this.k.getTextW(text)
			this.W = w + 2*this.config.marginW
			this.H = this.config.font_size + 2*this.config.marginH
		}
	}

	setConfig(){
		
	}

	control(){
	}

	

	draw(){
		if(!this.text) return
		
  		super.draw()

  		let k = this.k

  		let x = Math.min( Math.max(k.mX - this.W*0.5, 4), k.W - this.W - 4 )
  		let y = k.mY - this.H - 16

  		k.fill('rgb(70,70,70)')
  		k.fRect(x, y, this.W, this.H)
  		k.fLines(k.mX, k.mY, k.mX-8, k.mY-16, k.mX+8, k.mY-16)

  		k.setText('white', this.config.font_size)
  		
  		if(this.config.fixedWidth){
  			k.fTextWidth(this.text, x+this.config.marginW, y+this.config.marginH, this.W-2*this.config.marginW, this.config.font_size)
  		} else {
  			k.fText(this.text, x+this.config.marginW, y+this.config.marginH)
  		}
  		
	}
}