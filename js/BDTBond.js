// JavaScript Document
//-------We expect to solve Ut=Cx1(Ux)+Cx2(Uxx)+Cu(U)+f 


function Calculate(){
    var S= new Array(6);
    var k= new Array(6);
    //var P= new Array(6);
	//var Pu= new Array(5);
	//var Pd= new Array(5);
	//var r= new Array(6);
//	var v= new Array(6);
    S[1] = eval(document.isForm.S1.value);
    S[2] = eval(document.isForm.S2.value);
    S[3] = eval(document.isForm.S3.value);
    S[4] = eval(document.isForm.S4.value);
    S[5] = eval(document.isForm.S5.value);
    k[1] = eval(document.isForm.k1.value);
    k[2] = eval(document.isForm.k2.value);
    k[3] = eval(document.isForm.k3.value);
    k[4] = eval(document.isForm.k4.value);
    k[5] = eval(document.isForm.k5.value);
    


    
    var n=5;
    var N=eval(document.isForm.N.value);
    
    var Coupon=eval(document.isForm.Coupon.value);
    //var t
    var T=eval(document.isForm.T.value);
    //var Ts=eval(document.isForm.Ts.value);
    //var SwapN=Ts;// only for Tau=1; 
    //var X=eval(document.isForm.X.value);
    //var Tau=1;
    	//n     = number time periond
		//S		= yield curve
		//k		= yield volatility
		//N     = nominal amount
		//r     = spot short rate
		//rStar = spot rate at T?
		//SwapN = number of swap payment totally
		//t     = pricing date
		//T     = time to maturity of Bond
		//Tau   = number of swap payment par per year
		//var TL=T+SwapN/Tau; //TotalLife of swaption
		

		var PB= new Array(6);
		var PuB= new Array(5);
		var PdB= new Array(5);
		var rB= new Array(6);
		var vB= new Array(6);
		var CashFlow= new Array(6);
		var CashFlowm1= new Array(6);


		//------------------Have the interest rate tree 
		var FinalOptionPrice;
		var BC=new BDTCali();
		var vvoid=BC.Calibration(n,S,k,PB,PuB,PdB,rB,vB);


		
		// ------------------Terminal cashflow
		var i=T;		
		for(var j=0;j<=i-1;j++)
		{
            CashFlow[j]=N+Coupon;
        }
        		
		//-------------------Discount Back
		for(var i=T-1;i>=1;i--)
		{
			for(var j=0;j<=i-1;j++)
			{
				CashFlowm1[j]=Coupon+0.5*Max0(CashFlow[j])/(1+rB[i+1]*Math.pow(vB[i+1],j))+0.5*Max0(CashFlow[j+1])/(1+rB[i+1]*Math.pow(vB[i+1],j+1));		
		
			}
			for(var j=0;j<=5;j++)
			{
				CashFlow[j]=CashFlowm1[j];
			}
		}
		/*
		var i=TL-1;
		if(i==T)
		{
			i=TL;
			//cout<<"flag"<<endl;
			for(var j=0;j<=i-1;j++)
			{
				CashFlow[j]=X-rB[i]*Math.pow(vB[i],j);
							;//+(X-rB[i]*(vB[i],j));
			//cout<<CashFlow[j]<<" ";
			}
		
		}
		else
		{
			for(var j=0;j<=i-1;j++)
			{
				CashFlow[j]=0.5*(X-rB[i+1]*Math.pow(vB[i+1],j))/(1+rB[i+1]*Math.pow(vB[i+1],j))
							+0.5*(X-rB[i+1]*Math.pow(vB[i+1],j+1))/(1+rB[i+1]*Math.pow(vB[i+1],j+1))
							+(X-rB[i]*Math.pow(vB[i],j));
			//cout<<CashFlow[j]<<" ";
			}
			//cout<<endl;
		}
		if(TL-2>=T+1)
		{
			for(var i=TL-2;i>=T+1;i--)
			{
				if(i==T+1)
				{
					for(var j=0;j<=i-1;j++)
					{
						CashFlowm1[j]=0.5*CashFlow[j]/(1+rB[i+1]*Math.pow(vB[i+1],j))
								+0.5*CashFlow[j+1]/(1+rB[i+1]*Math.pow(vB[i+1],j+1))
								+(X-rB[i]*Math.pow(vB[i],j));
					//cout<<CashFlowm1[j]<<" ";
					}
			
				}
				else
				{
					for(var j=0;j<=i-1;j++)
					{
						CashFlowm1[j]=0.5*CashFlow[j]/(1+rB[i+1]*Math.pow(vB[i+1],j))
									+0.5*CashFlow[j+1]/(1+rB[i+1]*Math.pow(vB[i+1],j+1))
									+(X-rB[i]*Math.pow(vB[i],j));
				//cout<<CashFlowm1[j]<<" ";
					}
				}
				for(var j=0;j<=5;j++)
				{
					CashFlow[j]=CashFlowm1[j];
				}
			//cout<<endl;
			}
		}





		for(var i=T;i>=1;i--)
		{
			for(var j=0;j<=i-1;j++)
			{
				CashFlowm1[j]=0.5*Max0(CashFlow[j])/(1+rB[i+1]*Math.pow(vB[i+1],j))+0.5*Max0(CashFlow[j+1])/(1+rB[i+1]*Math.pow(vB[i+1],j+1));		
		
			}
			for(var j=0;j<=5;j++)
			{
				CashFlow[j]=CashFlowm1[j];
			}
		}
		*/
			FinalOptionPrice=CashFlow[0]/(1+rB[1]);

		
		


    document.isForm.price.value =FinalOptionPrice; 
    
 	
 	delete BC;
 	delete S;
 	delete k;
 	delete PB;
 	delete PuB;
 	delete PdB;
 	delete rB;
 	delete vB;
 	
}

 Max0 =function( x)
{
	if(x>0)
	{
		return x;
	}
	return 0;

}

function Reset(){

    document.isForm.S1.value="0.06";
    document.isForm.S2.value="0.06";
    document.isForm.S3.value="0.06";
    document.isForm.S4.value="0.06";
    document.isForm.S5.value="0.06";
    document.isForm.k1.value="0.20";
    document.isForm.k2.value="0.20";
    document.isForm.k3.value="0.20";
    document.isForm.k4.value="0.20";
    document.isForm.k5.value="0.20";
    document.isForm.N.value="100";
    document.isForm.T.value="1";
    document.isForm.Coupon.value="10";

    document.isForm.price.value=" ";


}
