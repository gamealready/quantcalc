// JavaScript Document


function Calculate(){
    var s0 = eval(document.isForm.s0.value);
//    var K = eval(document.isForm.K.value);
    var T = eval(document.isForm.T.value);
    var r = eval(document.isForm.r.value);
    var s = eval(document.isForm.s.value);
    var n = eval(document.isForm.n.value);
    var p = eval(document.isForm.p.value);
    
	var counter = 0;
    var tmp;
	
	for(j=1 ; j<=p ; j++){
        var path = new Pathgen(s0, r, s, T, n); // �C���I�s generate �ä��|�h�]�@�ӷs path �X�ӡA�ҥH�u�n���_ new �M delete
		path.Generate();
		counter += Math.exp(-r*T)*(path.Terminal() - path.Min());
		delete path;
	}
	document.isForm.c.value = (counter/p);
}

function Reset(){

    document.isForm.s0.value="100";
//    document.isForm.K.value="120";
    document.isForm.T.value="1";
    document.isForm.r.value="0.1";
    document.isForm.s.value="0.3";
    document.isForm.n.value="50";
    document.isForm.p.value="10000";
   	document.isForm.c.value ="";
}
