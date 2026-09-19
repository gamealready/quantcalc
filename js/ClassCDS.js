


function CDS_Hazard(){
   
    this.CDS_FromHazard =function(r,rr,nPerYear,mPerYear,Hazard,CDS)
    {
            var T=5;
            var n=nPerYear*T;
			var dt=T/n;
			var DiscFactor=new Array(n+1);
			var CSurProb=new Array(n+1);//Cumulative Survival Probability
			var CDefProb=new Array(n+1);//Cumulative Default Probability
			var MDefProb=new Array(n+1);//Marginal Default Probability
			var Prem=new Array (T*mPerYear+1);//Premiums
			var Default=new Array(n+1);//Defaults
			var Acr1=new Array(n+1);//Accrual
			var Acr2=new Array(n+1);//Accrual
			CSurProb[0]=1;
			CDefProb[0]=0;
			for(var i=0;i<=n;i++)
			{
				DiscFactor[i]=Math.exp(-r*dt*i);
				
			}
			for(var i=1;i<=n;i++)
			{
				CSurProb[i]=CSurProb[i-1]*Math.exp(-Hazard[Math.floor((i-1)/nPerYear)+1]*dt);
				CDefProb[i]=1-CSurProb[i];
				MDefProb[i]=CSurProb[i-1]-CSurProb[i];
				Default[i]=DiscFactor[i]*MDefProb[i]*(1-rr);
			}
			
			for(var i=1;i<=(T*mPerYear);i++)
			{
				Prem[i]=DiscFactor[Math.floor(i*nPerYear/mPerYear)]*CSurProb[Math.floor(i*nPerYear/mPerYear)]/mPerYear;
			}
			var RA=new Array(T+1); //Risky Annuity
			var DL=new Array(T+1);//Default Leg
			for(var i=1;i<=T;i++)
			{
				RA[i]=0;
				DL[i]=0;
			}
			for(var i=1;i<=mPerYear*T;i++)
			{
				RA[Math.floor((i-1)/mPerYear)+1]=RA[Math.floor((i-1)/mPerYear)+1]+Prem[i];
			}
			for(var i=1;i<=n;i++)
			{

				DL[Math.floor((i-1)/nPerYear)+1]=DL[Math.floor((i-1)/nPerYear)+1]+Default[i];
			}
			for(var i=2;i<=T;i++)
			{
				RA[i]=RA[i]+RA[i-1];
				DL[i]=DL[i]+DL[i-1];
			}
			for(var i=1;i<=T;i++)
			{
				CDS[i]=DL[i]/RA[i]*10000;
			}
			delete  DL;
			delete  RA;
			delete  DiscFactor;
			delete  CSurProb;
			delete  CDefProb;
			delete  MDefProb;
			delete  Prem;
			delete  Default;
			delete  Acr1;
			delete  Acr2;
        
        
        
       
        return 0;
    }

    



}
