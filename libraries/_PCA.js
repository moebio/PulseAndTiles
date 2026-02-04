
getPCA = function(table, nDimensions=3, normalize=false){
	let pcaTable = _doPCA(table, false, true, nDimensions, 1)[0].value
	if(pcaTable && normalize) pcaTable = _.normalizeLists(pcaTable)
	return pcaTable
}

getPCAandComponents = function(table, nDimensions=3, normalize=false){
	let pcaAll = _doPCA(table, false, normalize, nDimensions, 1)
	let pcaTable = pcaAll[0].value
	let components = pcaAll[1].value
	return {pcaTable, components}
}


projectPCA = function(vector, components){

	//_.dotProduct(enteredTextEmbedding, components[0]), _.dotProduct(enteredTextEmbedding, components[1]), _.dotProduct(enteredTextEmbedding, components[2])

	return {
		x:_.dotProduct(vector, components[0]),
		y:_.dotProduct(vector, components[1]),
		z:_.dotProduct(vector, components[2])
	}
}

_doPCA = function(table0,bFirstColumnIsLabel=false,bNormalizeData=true,k=3,f=1){
  var aColData = [];
  var i,j;
  var table = table0.clone();
  if(bFirstColumnIsLabel)
  	table.shift();

	var dt = new Date();
	//setMsg('1. Starting...');
  if(bNormalizeData){
  	for(i=0;i<table.length;i++){
  		aColData[i] = {include:true};
  		if(table[i].type == 'nL'){
  			aColData[i].mean = table[i].getMean();
  			aColData[i].stddev = table[i].getStandardDeviation();
  			table[i] = _.normalizeByZScore(table[i]);
  		}
  	}
  }

	//console.log('2. Input data normalized:' + bNormalizeData);
	
	//setTimeout(function(){

  var X0,X;
	//console.log('3. Input data has ' + table.length + ' cols and ' + table[0].length + ' rows');

	//setTimeout(function(){
  X0 = numeric.transpose(table);

  if(f == 1){
  	X = X0;
  }
  else{
  	var tableSamp = _.getRandomRows(table,f,true);
  	//console.log('3a. Sampling Complete. Using sample with ' + tableSamp[0].length + ' rows');
  	X = numeric.transpose(tableSamp);
  }

  //console.log('4. Transposed input table');      
	try{
		var U = pca(X);
	}
	catch(e){
		//console.log('Invalid input data.');
		return;
	}
  //console.log('5. PCA algorithm complete. U matrix is ' + U.length + ' by ' + U[0].length);      
	if(k<1 || k>table.length)
		k=table.length;
	U = _pcaReduce(U, k);
  //console.log('6. Reduced U to ' + k + ' components. U matrix is ' + U.length + ' by ' + U[0].length);      
	//console.log('[PCA] 2: ' + Math.abs(U[0][1] / U[0][0]).toFixed(3));
	// we want positive 
	var vmag=0;
	var vmax=0;
	for(i=0; i < U.length; i++){
		if(Math.abs(U[i][0]) > vmag){
			vmag=Math.abs(U[i][0]);
			vmax=U[i][0];
		}
	}
	if(vmax < 0){
		for(i=0;i<U.length;i++){
			for(j=0;j<U[i].length;j++)
				U[i][j] *= -1;
		}
	}
	//console.log('7. Made loading factors positive where possible.');

	// emit principal components
	var tabPC = new _.nT();
	tabPC.name = 'Principal Components in Columns';
	for(i=0; i<U[0].length;i++){
		tabPC[i] = new _.nL();
		tabPC[i].name = 'PC ' + (i+1);
		for(j=0;j<U.length;j++)
			tabPC[i][j]=U[j][i];
	}
	//console.log('8. Built Principal Components Output');

	//setTimeout(function(){
	var R = _pcaProject(X0,U);
	//console.log('9. Did _pcaProject. Output R is ' + R.length + ' by ' + R[0].length);
	R = numeric.transpose(R);
	//console.log('10. Transposed R');
	var tabProjected = new _.nT();
	tabProjected.name = 'Data Projected by Principal Components';

	//setTimeout(function(){
	for(i=0; i<R.length;i++){
		tabProjected[i] = new _.nL();
		tabProjected[i].name = 'PC ' + (i+1);
		for(j=0;j<R[i].length;j++){
			tabProjected[i][j]=R[i][j];
		}
	}
	//console.log('11. Built Projected Data Output Table. Dimensions are ' + tabProjected.length + ' by ' + tabProjected[0].length);
  if(bFirstColumnIsLabel){
  	tabProjected.unshift(table0[0].clone());
  }
	var sTimeDiff = (((new Date().getTime())-dt.getTime())/1000).toFixed(4);
	//console.log('12. Time elapsed: ' + sTimeDiff + ' s');
  	//console.log('13. Sending Data next');
	
	let output = sendOutput(tabPC,tabProjected)

	// console.log(tabPC)
	// console.log(tabProjected)
	// console.log(output)

	return output
	//console.log('14. Data Sent. Analysis Complete.');
	
	// split into the 4 segments that take appreciable time to make more responsive
	// },10);
	// },10);
	// },10);
	// },10);
}

function sendOutput(tabPC, tabProjected){
	if(tabPC==null)	tabPC = new mo.NumberTable();
	if(tabProjected==null)	tabProjected = new mo.NumberTable();
	var aOutput = [
		{
			type:'Table',
			name:'tabProjected',
			description:'Data Projected by Principal Components',
			value:null
		},
		{
			type:'Table',
			name:'tabPrincipalComponents',
			description:'Principal Components Table',
			value:null
		}
	];
	aOutput.isOutput = true;
	aOutput[0].value = tabProjected;
	aOutput[0].type = tabProjected.type;
	aOutput[1].value = tabPC;
	aOutput[1].type = tabPC.type;

	return aOutput;
}

pca = function(X) {
    /*
        Return matrix of all principle components as column vectors
    */  
    var m = X.length;
    var sigma = numeric.div(numeric.dot(numeric.transpose(X), X), m);
    return numeric.svd(sigma).U;
}
function _pcaReduce(U, k) {
    /*
        Return matrix of k first principle components as column vectors            
    */                
    return U.map(function(row) {
        return row.slice(0, k)
    });
}
function _pcaProject(X, Ureduce) {
    /*
        Project matrix X onto reduced principle components matrix
    */
    return numeric.dot(X, Ureduce);
}