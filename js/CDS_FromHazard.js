// JavaScript Document




	function Calculate()
	{
	    var rr=eval(document.isForm.R.value);
	    var nPerYear=eval(document.isForm.nPerYear.value);
	    var mPerYear=eval(document.isForm.mPerYear.value);
	    var r=eval(document.isForm.r.value)/100;
	    var Hazard=new Array(6);
	    var CDS=new Array(6);
    	Hazard[1]=eval(document.isForm.Hazard1.value);
    	Hazard[2]=eval(document.isForm.Hazard2.value);
    	Hazard[3]=eval(document.isForm.Hazard3.value);
    	Hazard[4]=eval(document.isForm.Hazard4.value);
    	Hazard[5]=eval(document.isForm.Hazard5.value);



        CDS[1]=2;
        var CH=new CDS_Hazard();
        var abc=CH.CDS_FromHazard(r,rr,nPerYear,mPerYear,Hazard,CDS);
        

        document.isForm.CDS1.value=CDS[1].toPrecision(3); 
        document.isForm.CDS2.value=CDS[2].toPrecision(3);
        document.isForm.CDS3.value=CDS[3].toPrecision(3);
        document.isForm.CDS4.value=CDS[4].toPrecision(3);
        document.isForm.CDS5.value=CDS[5].toPrecision(3);                                
        //document.isForm.CDSspread.value=CDSspread.toPrecision(3);  

        
   
	}
 	function Reset()
        {
                document.isForm.R.value="0.4";
                document.isForm.r.value="5";
                document.isForm.Hazard1.value="0.04944";
                document.isForm.Hazard2.value="0.06674";
                document.isForm.Hazard3.value="0.08536";
                document.isForm.Hazard4.value="0.10595";
                document.isForm.Hazard5.value="0.12945";
                document.isForm.mPerYear.value="4";
                document.isForm.nPerYear.value="20";
                document.isForm.CDS1.value="";
                document.isForm.CDS2.value="";
                document.isForm.CDS3.value="";
                document.isForm.CDS4.value="";
                document.isForm.CDS5.value="";
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
