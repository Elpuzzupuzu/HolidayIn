
function Height(node) { //vraća visinu (broj djece)
    if(!node){
        return -1;
    }
    return node.h;
}

function ChangePos(node, x, y){ //za razvrstat na ekranu

    if(!node)
        return;
    var temp = ( Math.pow(2, node.h-1) )*30; //da se ne preklope cvorovi

    if(node.left){ //crtanje linija-fja drawLine-canvas
      
        drawLine(x, y-100, x-temp, y);
    }
    if(node.right){
        drawLine(x, y-100, x+temp, y);

    }
   

    node.node.left= x+'px';
    node.node.top=y+'px';

//rekurzivno, crtanje djece, pomak za temp
    ChangePos(node.left,x-temp,y+100); 
    ChangePos(node.right,x+temp,y+100);
}


///////////////////////////////za avl////////////////////////////////////////////////

function makingAVL(node){ //razlika visina, ako je razlika u max broju djece u podstablima 1 vraća 1, ako je skroz balansirano 0
    if (!node){
        return 0;
    }
    return Height(node.left) - Height(node.right);
}



function rightRotate(node)  
{ 
    var x= node.left; 
    var T2 = x.right; 
  
    //  rotacija 
    x.right = node; 
    node.left = T2; 
  
    //  promini visine 
    node.h = Math.max(Height(node.left), Height(node.right))+1; 
    x.h = Math.max(Height(x.left), Height(x.right))+1; 
  
    // novi root 
    return x; 
} 
  

function leftRotate(node)  
{ 
    var y = node.right; 
    var T2 = y.left; 
  
    //  rotation 
    y.left = node; 
    node.right = T2; 
  
    //  promini visine 
    node.h = Math.max(Height(node.left), Height(node.right))+1; 
    y.h = Math.max(Height(y.left), Height(y.right))+1; 
  
    // novi root
    return y; 
} 