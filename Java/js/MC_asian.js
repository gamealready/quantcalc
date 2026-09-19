// JavaScript Document


function Calculate(){
    var s0 = eval(document.isForm.s0.value);
    var K = eval(document.isForm.K.value);
    var T = eval(document.isForm.T.value);
    var r = eval(document.isForm.r.value);
    var s = eval(document.isForm.s.value);
    var n = eval(document.isForm.n.value);
    var p = eval(document.isForm.p.value);
    
	var counter = 0;
    var tmp;
	
	for(j=1 ; j<=p ; j++){
        var path = new Pathgen(s0, r, s, T, n);
        // �@�˪����D�A�C���I�s generate �ä��|�h�]�@�ӷs path �X�ӡA�ҥH�u�n���_ new �M delete
		path.Generate();
		counter += ((tmp = path.Avg()-K)>0 ? Math.exp(-r*T)*tmp : 0) - ((tmp = path.GeoAvg()-K)>0 ? Math.exp(-r*T)*tmp : 0) + s0*Math.exp((-r-(n+2)*s*s/(6*(n+1)))*T/2)*NormalCDF((Math.log(s0/K)+(r+(n-1)*s*s/(6*(n+1)))*T/2)/(s*Math.sqrt((2*n+1)*T/(6*(n+1))))) - K*Math.exp(-r*T)*NormalCDF((Math.log(s0/K)+(r-s*s/2)*T/2)/(s*Math.sqrt((2*n+1)*T/(6*(n+1)))));
		delete path;
	}
	document.isForm.c.value = (counter/p);
}

function Reset(){

    document.isForm.s0.value="100";
    document.isForm.K.value="120";
    document.isForm.T.value="1";
    document.isForm.r.value="0.1";
    document.isForm.s.value="0.3";
    document.isForm.n.value="50";
    document.isForm.p.value="10000";
   	document.isForm.c.value ="";
}
