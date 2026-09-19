// JavaScript Document
//-------We expect to solve Ut=Cx1(Ux)+Cx2(Uxx)+Cu(U)+f 


function Calculate(){
    var S = eval(document.isForm.S.value);
    var X = eval(document.isForm.X.value);
    var T = eval(document.isForm.T.value);
    var r = eval(document.isForm.r.value);
    var rf = eval(document.isForm.rf.value);
    var sigma = eval(document.isForm.sigma.value);
    var H = eval(document.isForm.H.value);
    var Knock=eval(document.isForm.Knock.value);
    var K=eval(document.isForm.K.value);
    var Phi=eval(document.isForm.Phi.value);
    var NS=eval(document.isForm.NS.value);
    var Ni=eval(document.isForm.Ni.value);
    var NorT=eval(document.isForm.NorT.value);
    var DT=eval(document.isForm.DT.value);
    var DayOrClose=eval(document.isForm.DayOrClose.value);
    var t1=0;
    var t2=0;
    var DigitalPay=0;
    var VorD = 0;
    var YearDay=360;

    var NBday=2;//per year
    if(DT==1)
    {
        NBday = 4;//per year
    }
    else if(DT==2)
    {
        NBday = 12;//per year
    }
    NBday=Math.floor(T/(1.0/NBday));//per tenor
    var BarrierDay= new Array(NBday+1);
    for (var i=1;i<=NBday;i++)
    {
        BarrierDay[i] = i*YearDay/NBday;
    }
    
    
    document.isForm.price.value =DisBarrierMC( S, X, T, r, rf, sigma, H, Knock, K, Phi, NS, Ni, NorT, t1, t2, VorD, DigitalPay, YearDay, NBday, BarrierDay, DayOrClose);
 	
 	
}

DisBarrierMC =function( S, X, T, r, rf, sigma, H, Knock, K, Phi, NS, Ni, NorT, t1, t2, VorD, DigitalPay, YearDay, NBday, BarrierDay, DayOrClose)
{
            var IntervlPerDay = Ni/YearDay;
            var ans;
            var KnockTime= 0;
            var Eta = -1;
            
            if (S > H)
            {
                Eta = 1;
            }
            var dt;
            var SArray = new Array(NS + 1);
            var SPath = new Array(Ni + 1);
            var CS = new Array(NS + 1);
            var PS = new Array(NS + 1);
            var BarrierCallMC;
            var BarrierPutMC;
            var S0;
            var S1;
            var SumC;
            var SumP;

            SumC = 0;
            SumP = 0;





            dt = T / Ni;
            var MC=new RNG();

            for ( i = 1; i <= NS; i++)//Repeat
            {
                SPath[0] = S;

                for ( j = 1; j <= Ni; j++) //Path
                {
                    SPath[j] = SPath[j-1] *
                             Math.exp(MC.GetNormal() * sigma * Math.sqrt(dt) +
                                      (r - rf - 0.5 * sigma * sigma) * dt);
                }

                var flagIn=0;//1 is knock and 0 is not
                for(var ii=1;ii<=NBday;ii++) // Find Barrier Interval
                {
                    var tS, tE;
                    if(DayOrClose<0.5)
                    {
                        tS = Math.floor(IntervlPerDay * (BarrierDay[ii] - 1)); 
                    }
                    else
                    {
                        tS = Math.floor(IntervlPerDay * (BarrierDay[ii]) + 0.5) - 1;
                    }
                    tE = Math.floor(IntervlPerDay*(BarrierDay[ii] )+0.5);
                    //System.Console.WriteLine("tS=" + tS);
                    //System.Console.WriteLine("tE=" + tE);
                    for (var jj = tS + 1; jj <= tE; jj++)
                    {
                        if (Knock > 0.5) //Knock-Out 
                        {
                            if (Eta < 0) //Out and Up
                            {
                                if (SPath[jj] >= H) //Touch Barrier
                                {
                                    if (flagIn == 0)
                                    {
                                        KnockTime = jj*dt;

                                    }

                                    flagIn = 1;
                                    //System.Console.WriteLine("flagIn=" + flagIn);
                                    ii = NBday + 1;
                                    jj = tE + 1;

                                }

                            }
                            else //Out and Down
                            {
                                if (SPath[jj] <= H) //Touch Barrier
                                {
                                    if (flagIn == 0)
                                    {
                                        KnockTime = jj*dt;
                                    }

                                    flagIn = 1;
                                    ii =NBday + 1;
                                    jj = tE + 1;
                                }

                            }



                        }
                        else //Knock-In Option
                        {
                            if (Eta <= 0) //In and Up
                            {

                                if (SPath[jj] >= H)
                                {
                                    if (flagIn == 0)
                                    {
                                        KnockTime = jj*dt;

                                    }

                                    flagIn = 1;
                                    ii = NBday + 1;
                                    jj = tE + 1;
                                }
                            }
                            else //In and Down
                            {
                                if (SPath[jj] <= H)
                                {
                                    if (flagIn == 0)
                                    {
                                        KnockTime = jj*dt;

                                    }
                                    flagIn = 1;
                                    ii = NBday + 1;
                                    jj = tE + 1;
                                }

                            }
                        }
                    }
                }
                SArray[i] = SPath[Ni];
                var FlagMean;
                if (Knock==1)
                {
                    FlagMean = 1;

                }
                else
                {
                    FlagMean = 0;

                }


                if (flagIn == FlagMean)
                    {
                        if (NorT > 0.5)// Rebate at T
                        {
                            CS[i] = Math.exp(-r * T) * K;
                            PS[i] = Math.exp(-r * T) * K;
                        }
                        else if (NorT < 0.5) //Rebate when knocking
                        {
                            CS[i] = Math.exp(-r * KnockTime) * K;
                            PS[i] = Math.exp(-r * KnockTime) * K;
                        }

                    }
                    else// No Knock
                    {
                        if (VorD <= 0.5)//Vanilla
                        {
                            CS[i] = Math.exp(-r * T) * Math.max(SArray[i] - X, 0);
                            PS[i] = Math.exp(-r * T) * Math.max(X - SArray[i], 0);
                        }
                        else// Digital
                        {
                            CS[i] = Math.exp(-r * T) * DigitalPay;
                            PS[i] = Math.exp(-r * T) * DigitalPay;
                        }


                    }



                /*
                    if (flagIn == 0)
                    {
                        if (NorT > 0.5)// Rebate at T
                        {
                            CS[i] = Math.exp(-r * T) * K;
                            PS[i] = Math.exp(-r * T) * K;
                        }
                        else if (NorT < 0.5) //Rebate when knocking
                        {
                            CS[i] = Math.exp(-r * KnockTime) * K;
                            PS[i] = Math.exp(-r * KnockTime) * K;
                        }
                    }
                    else// No Knock
                    {
                        if (VorD <= 0.5)//Vanilla
                        {
                            CS[i] = Math.exp(-r * T) * Math.max(SArray[i] - X, 0);
                            PS[i] = Math.exp(-r * T) * Math.max(X - SArray[i], 0);
                        }
                        else// Digital
                        {
                            CS[i] = Math.exp(-r * T) * DigitalPay;
                            PS[i] = Math.exp(-r * T) * DigitalPay;
                        }
                    }
                
                */





                SumC = SumC + CS[i];
                SumP = SumP + PS[i];


            }


            BarrierCallMC = SumC / NS;
            BarrierPutMC = SumP / NS;

            if (Phi > 0.5)
            {
                ans = BarrierCallMC;
            }

            else
            {
                ans = BarrierPutMC;
            }


            return ans;

        }

function Reset(){

    document.isForm.NS.value="1000";
    document.isForm.Ni.value="100";
    document.isForm.S.value="95";
    document.isForm.X.value="100";    
    document.isForm.T.value="1";
    document.isForm.r.value="0.1";
    document.isForm.rf.value="0";    
    document.isForm.sigma.value="0.25";
    document.isForm.H.value="90";
    document.isForm.K.value="20";
    document.isForm.Knock.value="0";
    document.isForm.Phi.value="1";
    document.isForm.NorT.value="0";
    document.isForm.DT.value="0";
    document.isForm.DayOrClose.value="0";
    document.isForm.price.value="";
}
