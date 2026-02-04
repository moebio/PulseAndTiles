const agents = [
	//🐒 you
	{
		name:"you",
		emoji:"🐒",
		description:"text area",
		invitation:"I'm you! Let's type on the text box to talk with our friends.",
		example:"",
		inputs:[
			
		],
		outputs:[
			{
				name:"text",
				type:"string",
				description:"output text typed by user"
			}
		],
		talks:true,
		input:true,
		initsInstanceFunction:agentInstance=>{
			let timer
			agentInstance.changeInText = function(event){
				console.log("· change in text")
				clearTimeout(timer)
				agentInstance.dataObject = {value:event.value, type:"text"}
				if(event.value) {
					let send = ()=>agentInstanceSendData(agentInstance, {value:event.value, type:"text"})
					timer = setTimeout(send, 1500)
				}
			}
			agentInstance.textArea = createInputText(agentInstance.changeInText)

			let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			if(!SpeechRecognition) return
			
			let recognition = new SpeechRecognition();

			agentInstance.listening = false

			let initSpeech = function(){
				
			    //console.log("·) initSpeech -> this.listening", this.listening)

			    agentInstance.listening = true

			    //let recognition = this.recognition
			    recognition.lang = 'en-US';  // Set the language
			    recognition.interimResults = false;  // Set whether interim results should be returned
			    recognition.continuous = true;  // Listen continuously
			    
			    recognition.stop();

			    // Define the event handler for the result event
			    recognition.onresult = function(event) {
			        const lastResult = event.results[event.resultIndex];
			        const transcript = lastResult[0].transcript;
			        console.log('\n\n\n·) ·) ·) ·) ·) ·) ·) ·) ·) ·) 🐒 You said: ', transcript)

			        let newText = (agentInstance.textArea.getData()||"")+ " "+transcript
			        console.log("🐒", newText)
			        agentInstance.textArea.setData(newText)
			        agentInstanceSendData(agentInstance, {value:newText, type:"text"})
			    }

			    // Start speech recognition
			    try{recognition.start()}catch(e){}

			    // Handle errors
			    recognition.onerror = function(event) {
			        //console.error('·) Speech recognition error', event.error);
			    };

			    recognition.onspeechend = function() {
			        recognition.stop()
			        agentInstance.listening = false
			        console.log('·) Stopped recognition due to silence');
			    }
			}

			let endSpeech = function(){
				agentInstance.listening = false
				recognition.stop()
			    console.log('·) Stopped recognition, mouse left');
			}

			agentInstance.textArea.textArea.addEventListener('mousemove', function(event) {
                if(!agentInstance.listening) initSpeech()
            })
            agentInstance.textArea.textArea.addEventListener('mouseleave', function(event) {
                console.log(`🐒 Mouse left`);
                endSpeech()
            })
		},
		setDimensions:(agentInstance, x,y,w,h)=>{
			agentInstance.textArea.setDimensions(x,y,w,h)
		},
		remove:agentInstance=>{
			agentInstance.textArea.remove()
		}
	},

	//🦜 talker
	{
		name:"talker",
		emoji:"🦜",
		description:"This is the regular language model, to make questions and to generate texts.",
		invitation:"Ask me anything, I will try to answer or generate the text you want.",
		example:"Tell me a science fiction story about animals.",
		inputs:[
			{
				name:"description",
				type:"string",
				description:"prompt",
				invitation:"Ask me anything, I will try to answer or generate the text you want.",
				optional:false
			}
		],
		outputs:[
			{
				name:"answer",
				type:"string",
				description:"the completion or answer to prompt"
			}
		],
		talks:true,
		initsInstanceFunction:agentInstance=>{
			agentInstance.textArea = createTextArea()
		},
		//js_function:completion
		receiveData:(dataObject, agentInstance)=>{
			if(!dataObject) return
			console.log("🦜 dataObject", dataObject)

			const prompt = dataObject.value
			agentInstance.thinking = true
			completion(prompt, answer=>{
				//console.log("🦜 answer:", answer.content)
				agentInstance.thinking = false

				let response = answer.content

				agentInstanceSendData(agentInstance, {value:response, type:"text"})
			})
		},
		setDimensions:(agentInstance, x,y,w,h)=>{
			agentInstance.textArea.setDimensions(x,y,w,h)
		},
		remove:agentInstance=>{
			agentInstance.textArea.remove()
		}
	},

	//🦫 builder
	{
		name:"builder",
		emoji:"🦫",
		description:"Provide a description of a dataset and it will build it for you. Let it know if you want a table or else it will provide a json array",
		invitation:"Describe for me a dataset and I'll build it. If you want a table let me know. Tell me what's about and what main features it has, I might add other features if you propose so.",
		example:"a table of super heroes, with public and secret names, lots of metrics and categories, and a short description",
		inputs:[
			{
				name:"description",
				type:"string",
				description:"description of a dataset",
				invitation:"Describe for me a dataset and I'll build it. If you want a table let me know. Tell me what's about and what main features it has, I might add other features if you propose so.",
				optional:false
			},
			{
				name:"cycles",
				type:"number",
				description:"number of cycles of crawling, impacts the size of the outputed dataset",
				invitation:"Go for more cycles if you want a larger dataset (it will also take more time)",
				optional:true
			},
		],
		outputs:[
			{
				name:"data",
				type:"T|object",
				description:"the assembled data"
			}
		],
		talks:false,
		initsInstanceFunction:agentInstance=>{
			
		},
		//js_function:completion
		receiveData:(dataObject, agentInstance)=>{
			if(dataObject==null) return
			const dataDescription = dataObject.value
			if(typeof dataDescription!="string") return
			console.log("🦫 builds dataset: ", dataDescription)
			agentInstance.thinking = true
			dataCrawler(dataDescription, 1, answer=>{
				console.log("🦫 answer:", answer)
				agentInstance.thinking = false
				agentInstanceSendData(agentInstance, {value:answer, type:answer.type=="T"?"table":"json"})
			}, true)
		}
	},

	//🕷️ weaver
	{
		name:"weaver",
		emoji:"🕷️",
		description:"Builds networks from a text, various texts or a table",
		invitation:"Give me a text and I´ll weave a network of actors and connections",
		example:"",
		inputs:[
			{
				name:"resource",
				type:"string",
				description:"information source for building a network",
				invitation:"Give me a text and I´ll find actors and connections, or give me many texts and I connect them through similarity, or give me a table and I find a network inside",
				optional:false
			}
		],
		outputs:[
			{
				name:"network",
				type:"Net",
				description:"the network built"
			}
		],
		talks:false,
		initsInstanceFunction:agentInstance=>{
			
		},
		receiveData:(dataObject, agentInstance)=>{
			if(!dataObject) return
			const text = dataObject.value //in the future: it could be Table
			if(!text) return
			console.log("🕷️ entities network for: ", text)
			//agentInstance.dataObject = dataObject
			agentInstance.text = text
			agentInstance.thinking = true
			entitiesRelations(text, answer=>{
				console.log("🕷️ answer:", answer)
				agentInstance.thinking = false
				agentInstanceSendData(agentInstance, {value:answer.net, type:"net"})
			}, true)
		}
	},

	//🦋 visualizaer
	{
		name:"visualizer",
		emoji:"🦋",
		description:"Visualizes data that comes in form of table, JSON or Net",
		invitation:"Give me some data, I'll visualize it!",
		example:"",
		inputs:[
			{
				name:"data",
				type:"T|Net",
				description:"data in formats: table, JSON or Net",
				invitation:"Give me some data, I'll visualize it!",
				optional:false
			}
		],
		outputs:[
			{
				name:"data",
				type:"T|object",
				description:"the data being visualized"
			}
		],
		talks:false,
		initsInstanceFunction:agentInstance=>{
			
		},
		receiveData:(dataObject, agentInstance)=>{
			if(dataObject==null) return

			console.log("🦋 dataObject ", dataObject)
			
			agentInstance.receivedData = dataObject.value// data.net||data.data //change this!
			console.log("🦋 agentInstance.receivedData ", agentInstance.receivedData)
			//console.log("🦋 received data: ", agentInstance.data)
			if(agentInstance.view) removeTile(agentInstance.view)
			switch(agentInstance.receivedData.type){
				case "Net":
					loadTile(
						URL_VIEW_BASE+"Net",
						vw => {
							agentInstance.view = vw

							const netConfiguration = {
								nodes:{
									text_color:"rgba(255,255,255,0.5)",
									tooltip:true,
									tooltip_property:'description',
									draw_mode:'underline'
								},
								relations:{
									tooltip:true,
									tooltip_property:'description'
								}
							}

							console.log("🦋 sendData (net): ", agentInstance.data)
							
							agentInstance.view.sendData({value:netConfiguration, type:"configuration"})
							agentInstance.view.sendData({value:agentInstance.receivedData, type:"network"})
							agentInstance.view.setDimensions( 9999, 9999, 500, 400)
							//agentInstance.view.sendData({value:"centroid", type:"layout"})
							setTimeout(ev=>{agentInstance.view.sendData({value:"centroid", type:"layout"})}, 100)
							agentInstance.view.sendData({value:1.6, type:"nodes_zoom"})
							agentInstance.view.sendData({value:0.3, type:"zoom"})
						},
						obj=>{
							//console.log("🦚 data from network:", obj)
						},
						"net",
					)
					break
				case "T":
					loadTile(
						URL_VIEW_BASE+"Grid",
						vw => {
							agentInstance.view = vw
							console.log("🦋 agentInstance.receivedData ", agentInstance.receivedData)
							agentInstance.view.sendData({value:agentInstance.receivedData, type:"data"})
							agentInstance.view.setDimensions( 9999, 9999, 1, 1)
						},
						obj=>{
							//console.log("🦚 data from table:", obj)
						},
						"grid",
					)
					break
			}

			agentInstanceSendData(agentInstance, dataObject)

			//agentInstance.view.sendData({value:agentInstance.data, type:"network"})
		},
		setDimensions:(agentInstance, x,y,w,h)=>{
			agentInstance.view?.setDimensions(x,y,w,h)
		},
		remove:(agentInstance)=>{
			if(agentInstance.view) removeTile(agentInstance.view)
		}
	},

	//🐛 transformer
	{
		name:"transformer",
		emoji:"🐛",
		description:"Provide a dataset and a description of a transformation, it will generate a new dataset",
		invitation:"Give me some data and tell me how do you like I transform it",
		example:"create a new column dividing gdp by population",
		inputs:[
			{
				name:"description",
				type:"string",
				description:"description of a dataset transformation",
				invitation:"Describe for me how should I modify your dataset, either by creating or elimination columns, filtering rows, or any other change.",
				optional:false
			},
			{
				name:"data",
				type:"T",
				description:"table or json to be transformed",
				invitation:"Give me data to be transformed.",
				optional:true
			},
		],
		outputs:[
			{
				name:"data",
				type:"T|object",
				description:"the assembled data"
			}
		],
		talks:false,
		initsInstanceFunction:agentInstance=>{
			
		},
		//js_function:completion
		receiveData:(dataObject, agentInstance)=>{

			const value = dataObject.value

			switch(typeof value){
				case "string":
					agentInstance.description = value
					break
				default:
					agentInstance.receivedData = value
					break
			}

			if(agentInstance.description && agentInstance.receivedData){
				let textData

				console.log("🐛 agentInstance.receivedData.type:", agentInstance.receivedData.type)

				let prompt

				if(agentInstance.receivedData.type=="T"){
					//textData = _.TableToJSONString(agentInstance.receivedData)// _.TableToCSV(data, "\t", true)
					//textData = JSON.stringify(_.TableToJSON(agentInstance.receivedData), null, "\t")
					textData = _.TableToCSV(agentInstance.receivedData, ",", true)
					prompt = "You're a datawrangler, always finding ways to impreove the quality of datasets, or transform them according to instructions. This is a table:\n\n"+textData+"\n\nNow transform it, following these instructions: "+agentInstance.description+". The response should be a CSV table, without any previous or further comments, just a clean csv."
				} else {
					textData = JSON.stringify(agentInstance.receivedData, null, "\t")
					prompt = "this is a dataset:\n\n"+textData+"\n\nNow transform it, following these instructions: "+agentInstance.description+". The response should be a JSON array, without any previous or further comments, just a clean JSON."
				}

				console.log("🐛 //////////////////textData//////////////////")
				console.log(textData)
				console.log("🐛 ////////////////////////////////////////////")


				//console.log("🦎 prompt:", prompt)

				const prevModel = CHAT_GPT_API_MODEL
				CHAT_GPT_API_MODEL = "gpt-4o"
				agentInstance.thinking = true
				completion(prompt, answer=>{
					console.log("🐛 answer arrived")//, answer.content)
					agentInstance.thinking = false
					CHAT_GPT_API_MODEL = prevModel
					
					console.log("🐛 agentInstance.receivedData.type:", agentInstance.receivedData.type)

					let dataObject
					let type
					if(agentInstance.receivedData.type=="T"){
						//dataObject = _.ObjectToTable(json)
						let csv = answer.content
						console.log("🐛 csv:")
						console.log(csv)
						//if(csv.includes("\n\n")) csv = csv.split("\n\n")[1]
						dataObject = repairAndParseCSV(csv)// _.CSVToTable(csv, true, ",")
						type = "table"
					} else {
						// console.log("🦎 json:")
						// console.log(JSON.stringify(json, null, "\t"))
						dataObject = repairAndParseJSON(answer.content)
						type = "json"
					}

					console.log("🐛 dataObject:", dataObject)

					agentInstanceSendData(agentInstance, {value:dataObject, type})
				})
			}
		}
	},

	//🦉 analyst
	{
		name:"analyst",
		emoji:"🦉",
		description:"Provide a dataset and questions or ideas for analysis, it will return a text based answer",
		invitation:"Give me some data and make questions about it",
		example:"What's the best country to live on?",
		inputs:[
			{
				name:"question",
				type:"string",
				description:"question for analyzing the provided dataset",
				invitation:"Let me know what do you want to know about this data",
				optional:false
			},
			{
				name:"data",
				type:"T|object",
				description:"table or json to be analyzed",
				invitation:"Give me data to be analyzed.",
				optional:true
			},
		],
		outputs:[
			{
				name:"answer",
				type:"string",
				description:"response to the analysis question"
			}
		],
		talks:true,
		initsInstanceFunction:agentInstance=>{
			agentInstance.textArea = createTextArea()
		},
		
		receiveData:(dataObject, agentInstance)=>{
			if(dataObject==null){
				agentInstance.question = null
				agentInstance.receivedData = null
				return
			}
			const value = dataObject.value

			switch(typeof value){
				case "string":
					agentInstance.question = value
					break
				default:
					agentInstance.receivedData = value
					break
			}

			if(agentInstance.question && agentInstance.receivedData){
				let textData

				console.log("🦉 agentInstance.receivedData.type:", agentInstance.receivedData.type)

				let prompt

				if(agentInstance.receivedData.type=="T"){
					textData = _.TableToCSV(agentInstance.receivedData, ",", true)
					prompt = "You're a business analyst and a data scientist, with an amazing capability to see insigths in data. This is a table:\n\n"+textData+"\n\nNow respond the following question about the data on it: "+agentInstance.question+"\n\nPlease provide as much insight as you can, trying to answer the answer from multiple perspectives."
				} else {
					textData = JSON.stringify(agentInstance.receivedData, null, "\t")
					prompt = "this is a dataset:\n\n"+textData+"\n\nNow respond the following question about the data on it: "+agentInstance.question+"\n\nPlease thinks step by step, and provide as much insight as you can, trying to answer the answer from multiple perspectives."
				}

				console.log("🦉 //////////////////textData//////////////////")
				console.log(textData)
				console.log("🦉 ////////////////////////////////////////////")

				const prevModel = CHAT_GPT_API_MODEL
				CHAT_GPT_API_MODEL = "gpt-4o"
				agentInstance.thinking = true
				completion(prompt, answer=>{
					CHAT_GPT_API_MODEL = prevModel
					agentInstance.thinking = false

					let response = answer.content

					console.log("🦉 answer arrived")//, answer.content)
					console.log(response)
					agentInstanceSendData(agentInstance, {value:response, type:"text"})
				})
			}
		},
		setDimensions:(agentInstance, x,y,w,h)=>{
			agentInstance.textArea.setDimensions(x,y,w,h)
		},
		remove:agentInstance=>{
			agentInstance.textArea.remove()
		}
	},

	//🐠 grapher
	{
		name:"grapher",
		emoji:"🐠",
		description:"draws BI graphs",
		invitation:"Give me data, and isntructions to visualize them",
		example:"",
		inputs:[
			{
				name:"data",
				type:"T",
				description:"data to visualize",
				invitation:"Give me data.",
				optional:false
			},
			{
				name:"description",
				type:"string",
				description:"visualization instructions",
				invitation:"Tell me what parts of you data and how you want to visualize them.",
				optional:false
			}
		],
		outputs:[
			
		],
		talks:false,
		initsInstanceFunction:agentInstance=>{

			agentInstance.div_id = 'divV_'+agentInstance.id

			var newDiv = document.createElement('div');
	        newDiv.id = agentInstance.div_id

	        newDiv.style.position = "absolute"
			newDiv.style.left = "9999px"
			newDiv.style.top = "9999px"
			newDiv.style.width = "10px"
			newDiv.style.height = "10px"

	        let main = document.body//.getElementById('maindiv')
			main.appendChild(newDiv)

			agentInstance.visualization_div = newDiv
		},
		
		receiveData:(dataObject, agentInstance)=>{
			console.log("🐠 receive",dataObject)

			if(dataObject==null){
				// agentInstance.instructions = null
				// agentInstance.receivedData = null
				return
			}
			const value = dataObject.value


			switch(typeof value){
				case "string":
					agentInstance.instructions = value
					break
				default:
					agentInstance.receivedData = value
					agentInstance.dataObject = value
					break
			}

			console.log("🐠 typeof value",typeof value)
			console.log(agentInstance.instructions, agentInstance.receivedData)

			if(agentInstance.instructions && agentInstance.receivedData){

				console.log("🐠 data and instructions")

				const tableForPrompt = table=>{
					if(table[0].length>60) table = _.getRandomRows(table, 12, true)
					const array = []
					table.forEach(col=>{
						array.push({
							name:col.name,
							values:col.slice()
						})
					})
					return JSON.stringify(array, null, "\t")
				}

			    function extractFunctionFromString(inputString) {
				    // Use a regular expression to match the JavaScript function
				    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{[^]*}/;
				    const match = inputString.match(functionRegex);

				    // If a match is found, return the matched function
				    if (match) {
				        return eval("(" + match[0]+ ")");
				    } else {
				        return null;
				    }
				}

				const promptBase1 = `This is a sample of a table:

`
				const promptBase2 = `

Please write javascript function called visualizeData that internally uses Plotly, and access a div called "${agentInstance.div_id}", that receives the table (as an array of arrays, each column array with the feature label as property "name") and performs the following visualization:

<`
				const promptBase3 = `>

The output should be a plain javascript function, with no example of how it's used it, just the function because I will eval it.`
			
				const tableText = tableForPrompt(agentInstance.receivedData)

				const prompt = promptBase1+tableText+promptBase2+agentInstance.instructions+promptBase3

				//console.log("🐠", prompt)

				const prevModel = CHAT_GPT_API_MODEL
				CHAT_GPT_API_MODEL = "gpt-4o"
				agentInstance.thinking = true
				completion(prompt, answer=>{
					CHAT_GPT_API_MODEL = prevModel
					agentInstance.thinking = false

					let response = answer.content

					// console.log("🐠 answer arrived")//, answer.content)
					// console.log(answer)

					let jsFunction = extractFunctionFromString(response)

					//console.log("🐠 function", jsFunction)

					const array = []
					agentInstance.receivedData.forEach(col=>{
						array.push({
							name:col.name,
							values:col.slice()
						})
					})

					//const visualization_div = agentInstance.visualization_div
					jsFunction(array)
					//console.log("🐠 function executed-----")

					agentInstance.view = true
				})

				

			}
		},
		setDimensions:(agentInstance, x,y,w,h)=>{
			agentInstance.visualization_div.style.left = x+"px"
			agentInstance.visualization_div.style.top = y+"px"
			agentInstance.visualization_div.style.width = w+"px"
			agentInstance.visualization_div.style.height = h+"px"

			if(agentInstance.visualization_div && Plotly) {
				try{
					Plotly.relayout(agentInstance.div_id, { width: w, height: h });
				} catch(e){}
			}


		},
		remove:agentInstance=>{
			agentInstance.visualization_div.remove()
		}
	},

	//🐜 gatherer
	{
		name:"gatherer",
		emoji:"🐜",
		description:"Provide a url of a dataset and it will bring it and parse it.",
		invitation:"Tell me the url of a dataset, I'll bring it to you.",
		example:"",
		inputs:[
			{
				name:"url",
				type:"string",
				description:"url of a dataset",
				invitation:"Tell me the url of a dataset, I'll bring it to you.",
				optional:false
			}
		],
		outputs:[
			{
				name:"data",
				type:"T|object",
				description:"the gathered data"
			}
		],
		talks:false,
		initsInstanceFunction:agentInstance=>{
			
		},
		//js_function:completion
		receiveData:(dataObject, agentInstance)=>{
			if(dataObject==null) return
			const url = dataObject.value
			agentInstance.thinking = true
			_.loadData(url, answer=>{
				console.log("🐜 answer:", answer)

				const table = _.CSVToTable(answer.result)

				agentInstance.thinking = false
				agentInstanceSendData(agentInstance, {value:table, type:"table"})
			})
		}
	},

	// {
	// 	name:"chuckenizer",
	// 	emoji:"🦈",
	// 	description:"takes a text and splits in chunks",
	// 	example:"",
	// 	inputs:[
	// 		{
	// 			name:"text",
	// 			type:"string",
	// 			description:"text to be chuckenized",
	// 			invitation:"Give me a (long) text, I will separate it in small chunks so you can analize or connect them",
	// 			optional:false
	// 		},
	// 		{
	// 			name:"method",
	// 			type:"string",
	// 			description:"chuckenization method [number of chunks|length of chunks|character]",
	// 			invitation:"Let me know how do you like me to split the text in parts",
	// 			optional:true
	// 		},
	// 	],
	// 	outputs:[
	// 		{
	// 			name:"chunks",
	// 			type:"array",
	// 			description:"list of chunks"
	// 		}
	// 	],
	// 	talks:false,
	// 	initsInstanceFunction:null,
	// 	js_function:null//chuckenizer
	// }
]







// 🐒 you
//    crawler
// 🦋 Visualizer
// 🦜 conversation
// 🦫 builder
// 🕷️ weaver
// 🐛 transformer



// 🐜 gatherer
// 🐝 coder



//    solver
//   planner


// 🐦 dataset ideator
// 🦊 solutions selector
// 🐘 data analyst

//    matcher
// 🦈 chuckenizer
//     searcher
// 🦅 falcon
//    web scrapper



// 📊 data
// 📃 text
// 📄 document
// 📚 texts
// #️⃣ number
// 🔧 tool
