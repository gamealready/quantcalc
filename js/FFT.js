var conv = function(aaa, bbb){
    var n = aaa.length;
    var tmp1 = fft(r2c(pad(aaa)));
    var tmp2 = fft(r2c(pad(bbb)));
    
    for(var i=0 ; i<2*n ; i++)  
        tmp1[i] = tmp1[i].mult(tmp2[i]);
    
    tmp1 = c2r(ifft(tmp1));
    for(var i=0 ; i<2*n ; i++)  
        tmp1[i] = tmp1[i]/(2*n);

    return tmp1;    
}

var pad = function(aaa){
    var ccc = [];           // copy the whole array or the original array will be changed. 
    var n = aaa.length;
    
    for(var i=0 ; i<n ; i++)   
        ccc.push(aaa[i]);
    for(var i=0 ; i<n ; i++)   
        ccc.push(0);
    return ccc;    
}

var c2r = function(aaa){ 
    var r = new Array(aaa.length);
    for(var i=0 ; i<aaa.length ; i++)   
        r[i] = aaa[i].re();
    return r;
}
var r2c = function(aaa){    // input an array of real numbers, output an array of complex numbers
    var c = [];
    for(var i=0 ; i<aaa.length ; i++)   
        c.push(new ComplexNumber(aaa[i], 0));
    return c;  
}

var fft = function(aaa){    //input an array of 2^n complex numbers

    var bbb = aaa;        
    var n = bbb.length;
    var even = [];
    var odd = [];
    var result = [];

    if(n == 1){
        return bbb;
    }else{
        for(var i=0 ; i<=n-1 ; i+=2){
            even.push(bbb[i]);
            odd.push(bbb[i+1]);
        }
        even = fft(even);
        odd = fft(odd);
        
        for( i=0 ; i<n/2 ; i++ )    result.push(even[i].add(odd[i].mult(Math.cos(2*Math.PI*i/n), Math.sin(2*Math.PI*i/n))));
        for( i=0 ; i<n/2 ; i++ )    result.push(even[i].sub(odd[i].mult(Math.cos(2*Math.PI*i/n), Math.sin(2*Math.PI*i/n))));
        return result;
    }
}

var ifft = function(aaa){    //input an array of 2^n complex numbers

    var bbb = aaa;        
    var n = bbb.length;
    var even = [];
    var odd = [];
    var result = [];

    if(n == 1){
        return bbb;
    }else{
        for(var i=0 ; i<=n-1 ; i+=2){
            even.push(bbb[i]);
            odd.push(bbb[i+1]);
        }
        even = ifft(even);
        odd = ifft(odd);
        
        for( i=0 ; i<n/2 ; i++ )    result.push(even[i].add(odd[i].mult(Math.cos(2*Math.PI*i/n), Math.sin(-2*Math.PI*i/n))));
        for( i=0 ; i<n/2 ; i++ )    result.push(even[i].sub(odd[i].mult(Math.cos(2*Math.PI*i/n), Math.sin(-2*Math.PI*i/n))));
        return result;
    }
}
