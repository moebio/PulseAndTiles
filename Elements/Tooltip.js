class Tooltip extends Element{

	/////////////////////////////////////////constructor
	constructor(k, callBackSendData, config={font_size:16, marginW:10, marginH:6}){
		super(k, callBackSendData, config)

		this.text
		this.W
		this.H
	}

	setData(text){
		this.text = text
		this.k.setText('white', this.config.font_size)
		let w = this.k.getTextW(text)
		this.W = w + 2*this.config.marginW
		this.H = this.config.font_size + 2*this.config.marginH
	}

	setConfig(){
		
	}

	control(){
	}

	

	draw(){
  		super.draw()

  		let x = Math.min( Math.max(this.k.mX - this.W*0.5, 4), this.k.W - this.W - 4 )
  		let y = this.k.mY - this.H - 16

  		this.k.fill('rgb(70,70,70)')
  		// this.k._fRect(x, y, this.W, this.H)
  		// this.k._fLines(this.k.mX, this.k.mY, this.k.mX-8, this.k.mY-16, this.k.mX+8, this.k.mY-16)
  		this.k.fRect(x, y, this.W, this.H)
  		this.k.fLines(this.k.mX, this.k.mY, this.k.mX-8, this.k.mY-16, this.k.mX+8, this.k.mY-16)

  		this.k.setText('white', this.config.font_size)
  		//this.k._fText(this.text, x+this.config.marginW, y+this.config.marginH)
  		this.k.fText(this.text, x+this.config.marginW, y+this.config.marginH)
	}
}