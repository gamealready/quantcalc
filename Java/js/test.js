// JavaScript Document


/*	function Calculate()
	{
	    var Principal=eval(document.isForm.isPrincipal.value);
	    var Tk=eval(document.isForm.isTk.value);
    	var Tk_1=eval(document.isForm.isTk_1.value);
    	var DiscFactor=eval(document.isForm.isDiscFactor.value);
    	var Forward=eval(document.isForm.isForward.value);
    	var Strike=eval(document.isForm.isStrike.value);
    	var Vol=eval(document.isForm.isVol.value);
    	var ComPeriod=Tk_1-Tk;
    	var D1=(Math.log(Forward/Strike)+Vol*Vol*Tk*0.5)/(Vol*Math.sqrt(Tk));;
    	var D2=D1-Vol*Math.sqrt(Tk);;
    	
        document.isForm.isCapletPrice.value=Principal*ComPeriod*DiscFactor*(Forward*NormalCDF(D1)-Strike*NormalCDF(D2));  
   
	}*/
 	function Reset()
        {
                document.isForm.isPrincipal.value="1000000";
                document.isForm.isTk.value="1";
                document.isForm.isTk_1.value="2";
                document.isForm.isDiscFactor.value="0.9";
                document.isForm.isForward.value="0.08";
                document.isForm.isStrike.value="0.07";
                document.isForm.isVol.value="0.2";

        }
       	function NormalCDF(x)
        {
		var L;
        var K;
        var w;
		/* absolute error  < 7.5e-8 */   
	    var a1 = 0.31938153; 
        var a2 = -0.356563782;
        var a3 = 1.781477937;
		var a4 = -1.821255978;
        var a5 = 1.330274429;
		L = Math.abs(x);
		K = 1.0 / (1.0 + 0.2316419 * L);
		w = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-L *L / 2) * (K*(a1 + K *(a2 +K*( a3 +K*(a4+a5*K)))));
		if (x < 0 )
		{     
			  w= 1.0 - w;
		}   
		return (w);
        }
