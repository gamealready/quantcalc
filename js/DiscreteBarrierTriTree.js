// JavaScript Document
 


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
    var NS=0;//var NS=eval(document.isForm.NS.value);
    var Ni=eval(document.isForm.Ni.value);
    var NorT=0;//var NorT=eval(document.isForm.NorT.value);
    var DT=eval(document.isForm.DT.value);
    var DayOrClose=0;//var DayOrClose=eval(document.isForm.DayOrClose.value);
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
    
    
    document.isForm.price.value =DisBarrierTriTree( S, X, T, r, rf, sigma, H, Knock, K, Phi, NS, Ni, NorT, t1, t2, VorD, DigitalPay, YearDay, NBday, BarrierDay, DayOrClose);
 	
 	
}
DisBarrierTriTree =function( S, X, T, r, rf, sigma, H, Knock, K, Phi, NS, Ni, NorT, t1, t2, VorD, DigitalPay, YearDay, NBday, BarrierDay, DayOrClose)
{
            var u;
            //double d;
            var Pu, Pm, Pd, lambda, dt;
            var OpOut = new Array(2 * Ni + 1);
            var OpIn = new Array(2 * Ni + 1);
            var OpR = new Array(2 * Ni + 1);
            var i, j, h;

            for (i = 1; i <= NBday; i++)
            {
                BarrierDay[i] = Math.floor(BarrierDay[i] / BarrierDay[NBday] * Ni + 0.5);
            }



            dt = T / Ni;
            //h is Steps to reach barrier
            if (S > H)
            {
                h = Math.floor(Math.log(S / H) / (sigma * Math.sqrt(dt)));
            }
            else
            {
                h = Math.ceil(Math.log(S / H) / (sigma * Math.sqrt(dt)));
            }

            // make sure the barrier is in the tree
            if (Math.abs(h) < 1 || Math.abs(h) > Ni)
            {
                //System.Console.WriteLine("Please increase Ni, h=" + h);
            }

            //Choose lambda to make sure that one of the layers of the tree coincides with the barrier.
            lambda = Math.log(S / H) / (h * sigma * Math.sqrt(dt));

            // The probability of up, middle, down
            Pu = 1 / (2 * lambda * lambda) + (r - rf - 0.5 * sigma * sigma) * Math.sqrt(dt) / (2 * lambda * sigma);
            Pd = 1 / (2 * lambda * lambda) - (r - rf - 0.5 * sigma * sigma) * Math.sqrt(dt) / (2 * lambda * sigma);
            Pm = 1 - Pu - Pd;
            u = Math.exp(lambda * sigma * Math.sqrt(dt));

            //Terminal Condition            
            for (i = 0; i <= 2 * Ni; i++)
            {
                OpOut[i] = Math.max(0, Phi * (S * Math.pow(u, Ni - i) - X));
                OpIn[i] = 0;
                OpR[i] = 0;

            }
            //On the barrier
            
            if(H<=S)
            {
                for (i = Ni + h; i <= 2 * Ni; i++)
                {
                    OpIn[i] = OpOut[i];
                    OpOut[i] = 0;
                    OpR[i] = K;
                }

            }
            else
            {
                for (i = 0; i <= Ni + h; i++)
                {
                    OpIn[i] = OpOut[i];
                    OpOut[i] = 0;
                    OpR[i] = K;
                }

            }
            


            // Backward Calculation
            var jj = NBday - 1;
            for (j = Ni - 1; j >= 0; j--)
            {
                for (i = 0; i <= 2 * j; i++)
                {
                    OpOut[i] = Math.exp(-r * dt) * (Pu * OpOut[i] + Pm * OpOut[i + 1] + Pd * OpOut[i + 2]);
                    OpIn[i] = Math.exp(-r * dt) * (Pu * OpIn[i] + Pm * OpIn[i + 1] + Pd * OpIn[i + 2]);
                    OpR[i] = Math.exp(-r * dt) * (Pu * OpR[i] + Pm * OpR[i + 1] + Pd * OpR[i + 2]);

                }
                if ( (j == BarrierDay[jj]))
                {
                    jj--;
                    if ((h + j >= 0) && (h + j <= 2 * j))// barrier in the tree
                    {

                        

                        if (H <= S)
                        {
                            for (i = j + h; i <= 2*j; i++)
                            {
                                OpIn[i] += OpOut[i];
                                OpOut[i] = 0;
                                OpR[i] = K;
                            }

                        }
                        else
                        {
                            for (i = 0; i <= j + h; i++)
                            {
                                OpIn[i] += OpOut[i];
                                OpOut[i] = 0;
                                OpR[i] = K;
                            }

                        }
                        //}
                        //}
                    }
                }

            }
            if (Knock == 0)
            {

                return OpIn[0]+ OpR[0];
            }
            else
            {
                return OpOut[0] + OpR[0];
            }  



}


function Reset(){

    //document.isForm.NS.value="1000";
    document.isForm.Ni.value="100";
    document.isForm.S.value="95";
    document.isForm.X.value="100";    
    document.isForm.T.value="1";
    document.isForm.r.value="0.1";
    document.isForm.rf.value="0";    
    document.isForm.sigma.value="0.25";
    document.isForm.H.value="90";
    document.isForm.K.value="20";
    document.isForm.Knock.value="1";
    document.isForm.Phi.value="1";
    //document.isForm.NorT.value="0";
    document.isForm.DT.value="0";
    //document.isForm.DayOrClose.value="0";
    document.isForm.price.value="";
}
