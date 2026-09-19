// JavaScript Document
 


function Calculate(){
    var mu = 0;//eval(document.isForm.mu.value);
    var T = eval(document.isForm.T.value);
    var s = eval(document.isForm.s.value);
    var sigma = eval(document.isForm.sigma.value)*Math.sqrt(s)*(T-s);
    var alpha = eval(document.isForm.alpha.value);
    var Sta=new Statistic();
    var PFE=mu+sigma*Sta.stdnormal_inv(alpha);
    var EE=mu*Sta.NormalCDF(mu/sigma)+sigma*Sta.NormalPDF(mu/sigma);
    document.isForm.EE.value =EE.toPrecision(4);
    document.isForm.PFE.value =PFE.toPrecision(4);	
 	
}


function Reset(){

    //document.isForm.NS.value="1000";
    document.isForm.mu.value="2";       
    document.isForm.sigma.value="4";
    document.isForm.alpha.value="0.99";
    document.isForm.EE.value="";
    document.isForm.PFE.value="";
}
