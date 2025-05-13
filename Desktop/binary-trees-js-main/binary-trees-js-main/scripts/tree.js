var rootPosition = 120; // 120 px desde la parte superior de la pantalla es la raíz

class Node { // Declaración de clase para dibujar un nodo, por ejemplo, si ponemos new Node(2,10,20) se agrega un nodo con el número 2 en la posición 10-20
    constructor(data, x, y) { // Constructor: método especial que crea e inicializa el objeto.
        this.data = data;
        this.left = null;
        this.right = null;

        this.h = 0; // Profundidad del nodo (hijos)
        ///// PARA DIBUJAR: /////
        this.n = document.createElement('div'); // Se crea un elemento div
        this.n.innerHTML = data; // El número dentro del nodo
        this.n.className = "node"; // Se agrega la clase definida en el CSS
        this.node = this.n.style; // Se definen las propiedades CSS del nodo
        this.node.top = y + 'px'; // Posicionamiento en la página. Ejemplo: la raíz está a 80 píxeles
        this.node.left = x + 'px'; // La raíz está a 441 píxeles
        document.body.appendChild(this.n); // Se agrega a la página
        return this;
    }
}

class BinarySearchTree {
    constructor() {
        this.root = null;
    } // Métodos:
    //////// AVL ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    insertAVL(data) { // Insertar nuevo nodo. Primero se verifica que no se agregue un nodo duplicado

        if (!this.isthere(this.root, data)) {
            alert("¡El elemento ya existe!");

            return;
        }
        if (this.isZero(data)) {
            alert("¡El elemento no puede ser 0!");

            return;
        }

        else if (this.root === null) {
            var newNode = new Node(data, window.innerWidth / 2, rootPosition);
            this.root = newNode;
            //alert("El elemento "+newNode.data+" se convierte en la raíz");

        }
        else {
            this.root = this.insertNodeAVL(data, this.root, this.root.node.left, this.root.node.top);
            clearCanvas();

            ChangePos(this.root, window.innerWidth / 2, rootPosition);

        }

    }

    insertNodeAVL(val, node, x, y) {

        if (!node) {
            return new Node(val, x, y);
        }
        if (val < node.n.innerHTML) {
            node.left = this.insertNodeAVL(val, node.left, parseInt(node.node.left) - 50, parseInt(node.node.top) + 50);
        }
        else if (val > node.n.innerHTML) {
            node.right = this.insertNodeAVL(val, node.right, parseInt(node.node.left) + 50, parseInt(node.node.top) + 50);
        }
        else {
            return node;
        }
       
        return this.Balance(val,node); // Se retorna el árbol balanceado

    }

    removeAVL(data) {

        this.root = this.deleteAVL(this.root, data);

        clearCanvas(); 
        ChangePos(this.root, window.innerWidth / 2, rootPosition); 

    }

    deleteAVL(node,key) {

        /*if (node === null) {
            return null;
        }*/ // Ya realizamos la verificación antes

        if (key < node.data) {
            node.left = this.deleteAVL(node.left, key);
            
        }

        else if (key > node.data) {
            node.right = this.deleteAVL(node.right, key);
           
        }

        else {

            // Sin hijos
            if (node.left === null && node.right === null) {

                var temp = node;
                document.body.removeChild(temp.n);
                temp = null;

                return null;

            }

            // Un hijo
            if (node.left === null) {

                var temp = node;
                node = node.right;
                document.body.removeChild(temp.n);

                temp = null;
                return node;
            }

            else if (node.right === null) {

                var temp = node;
                node = node.left;
                document.body.removeChild(temp.n);

                temp = null;
                return node;
            } 
            else { // Dos hijos

                // Mínimo en el derecho o máximo en el izquierdo: caso con ambos hijos.. se pueden intercambiar los valores.
                var temp = this.findMinNode(node.right);

                node.n.innerHTML = temp.n.innerHTML;

                node.data = temp.data;

                node.right = this.deleteAVL(node.right, temp.data); 
            }
        
        }
        var x=this.BalanceForDelete(node); // Se balancea de manera diferente al insertar
        return x;   // Retorna el árbol balanceado
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    insert(data) { // Insertar un nuevo nodo. Primero se verifica que no se agregue un nodo duplicado

        if (!this.isthere(this.root, data)) { // isthere retorna false si el elemento ya existe
            alert("¡El elemento ya existe!");

            return;
        }
        if (this.isZero(data)) { // isZero retorna true si el valor es 0
            alert("¡El elemento no puede ser 0!");

            return;
        }

        else if (this.root === null) { // Si no hay raíz
            var newNode = new Node(data, window.innerWidth / 2, rootPosition);
            this.root = newNode;
            //alert("El elemento "+newNode.data+" se convierte en la raíz");

        }
        else {
            var newNode = new Node(data, window.innerWidth / 2, rootPosition);

            this.insertNode(this.root, newNode, parseInt(this.root.node.left), parseInt(this.root.node.top));
            clearCanvas();

            ChangePos(this.root, window.innerWidth / 2, rootPosition);

        }

    }

    insertNode(node, newNode, x, y) {

        if (newNode.data < node.data) {
            if (node.left === null) {
                node.left = newNode;

            }
            else
                this.insertNode(node.left, newNode, x - 50, y + 50); // Posicionamiento en la pantalla, y+50 baja el nodo

        }

        else if (newNode.data > node.data) {
            if (node.right === null) {
                node.right = newNode;

            }
            else
                this.insertNode(node.right, newNode, x + 50, y + 50);
        }

        node.h = 1 + Math.max(Height(node.left), Height(node.right)); // Actualizar las alturas

    }

    isZero(data) {
        if (data == 0) {
            alert("La entrada debe ser un número natural");
            return true;
        }
        else
            return false;
    }

    isthere(node, data) { // Retorna false si el nodo ya existe

        if (node === null)
            return true;

        else if (data < node.data)
            return this.isthere(node.left, data);

        else if (data > node.data)
            return this.isthere(node.right, data);

        else
            return false;
    }

    find(node, data)  // Similar a isthere, pero esta se usa para la función de búsqueda de un elemento
    {
        if (node === null)
            return null;

        else if (data < node.data)
            return this.find(node.left, data);

        else if (data > node.data)
            return this.find(node.right, data);

        else
            return node;
    }

    inorder(node) { // Función auxiliar para imprimir en la consola
        if (node !== null) {
            this.inorder(node.left);
            console.log(node.data);
            this.inorder(node.right);
        }
    }

    ispis(node) { // Imprimir en la parte inferior de la pantalla
        var poljeIspis = document.getElementById("poljeIspis");
        if (node !== null) {
            this.ispis(node.left);
            poljeIspis.innerHTML += node.data + '&nbsp;&nbsp;&nbsp;'
            this.ispis(node.right);
        }
    }

    ispisPreorder(node) { // Imprimir en la parte inferior de la pantalla
        var poljeIspis = document.getElementById("poljeIspis");
        if (node !== null) {
            poljeIspis.innerHTML += node.data + '&nbsp;&nbsp;&nbsp;'

            this.ispisPreorder(node.left);
            this.ispisPreorder(node.right);
        }
    }

    ispisPostorder(node) { // Imprimir en la parte inferior de la pantalla
        var poljeIspis = document.getElementById("poljeIspis");
        if (node !== null) {

            this.ispisPostorder(node.left);
            this.ispisPostorder(node.right);
            poljeIspis.innerHTML += node.data + '&nbsp;&nbsp;&nbsp;'

        }
    }




    // retorna la raíz del árbol 
getRootNode() {
    return this.root;
}

findMinNode(node) {
    // encuentra el nodo mínimo
    if (node.left === null)
        return node;
    else
        return this.findMinNode(node.left);
}

findMaxNode(node) {
    // encuentra el nodo máximo
    if (node.right === null)
        return node;
    else
        return this.findMaxNode(node.right);
}

remove(data) {
    // elimina el nodo con el valor 'data'
    this.root = this.delete(this.root, data);
    clearCanvas();

    // cambia la posición del árbol en la imagen
    ChangePos(this.root, window.innerWidth / 2, rootPosition);
}

delete(node, key) {
    // elimina un nodo de acuerdo a su clave
    if (node === null)
        return null;

    else if (key < node.data) {
        node.left = this.delete(node.left, key);
        return node;
    }

    else if (key > node.data) {
        node.right = this.delete(node.right, key);
        return node;
    }

    else {
        // eliminando un nodo sin hijos
        if (node.left === null && node.right === null) {
            alert("Elemento " + node.data + " ha sido eliminado");

            var temp = node;
            document.body.removeChild(temp.n);
            temp = null;

            return null;
        }

        // eliminando un nodo con un solo hijo
        if (node.left === null) {
            alert("Elemento " + node.data + " ha sido eliminado. Su hijo derecho " + node.right.data + " reemplaza su lugar");

            var temp = node;
            node = node.right;
            document.body.removeChild(temp.n);

            temp = null;
            return node;
        }

        else if (node.right === null) {
            alert("Elemento " + node.data + " ha sido eliminado. Su hijo izquierdo " + node.left.data + " reemplaza su lugar");

            var temp = node;
            node = node.left;
            document.body.removeChild(temp.n);

            temp = null;
            return node;
        }
        else {
            // mínimo en el subárbol derecho o máximo en el izquierdo en el caso con ambos hijos, solo se intercambian los valores.
            var temp = this.findMinNode(node.right);
            alert("Elemento " + node.data + " ha sido eliminado. El elemento mínimo del subárbol derecho " + temp.data + " reemplaza su lugar");

            node.n.innerHTML = temp.n.innerHTML;

            node.data = temp.data;

            node.right = this.deleteSec(node.right, temp.data);
            return node;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// misma función delete pero sin los comentarios (alerta) para el caso con 2 hijos
deleteSec(node, key) {
    if (node === null)
        return null;

    else if (key < node.data) {
        node.left = this.deleteSec(node.left, key);
        return node;
    }

    else if (key > node.data) {
        node.right = this.deleteSec(node.right, key);
        return node;
    }

    else {
        // eliminando un nodo sin hijos
        if (node.left === null && node.right === null) {
            var temp = node;
            document.body.removeChild(temp.n);
            temp = null;

            return null;
        }

        // eliminando un nodo con un solo hijo
        if (node.left === null) {
            var temp = node;
            node = node.right;
            document.body.removeChild(temp.n);

            temp = null;
            return node;
        }

        else if (node.right === null) {
            var temp = node;
            node = node.left;
            document.body.removeChild(temp.n);
            temp = null;
            return node;
        }
        else {
            // mínimo en el subárbol derecho o máximo en el izquierdo en el caso con ambos hijos, solo se intercambian los valores.
            var temp = this.findMinNode(node.right);

            node.n.innerHTML = temp.n.innerHTML;

            node.data = temp.data;

            node.right = this.deleteSec(node.right, temp.data);
            return node;
        }
    }
}

BalanceForDelete(node) {
    // calcula la altura del nodo y balancea el árbol después de la eliminación
    node.h = 1 + Math.max(Height(node.left), Height(node.right));
    var balance = makingAVL(node);

    // rotación izquierda-izquierda
    if (balance > 1 && makingAVL(node.left) >= 0) {
        node = rightRotate(node);
        return node;
    }

    // rotación derecha-derecha
    if (balance < -1 && makingAVL(node.right) <= 0) {
        node = leftRotate(node);
        return node;
    }

    if (balance > 1 && makingAVL(node.left) < 0) {
        node.left = leftRotate(node.left);
        node = rightRotate(node);
        return node;
    }

    // caso derecha-izquierda
    if (balance < -1 && makingAVL(node.right) > 0) {
        node.right = rightRotate(node.right);
        node = leftRotate(node);
        return node;
    }

    return node;
}

Balance(val, node) {
    // calcula la altura del nodo y balancea el árbol después de la inserción
    node.h = 1 + Math.max(Height(node.left), Height(node.right));
    var balance = makingAVL(node);

    // rotación izquierda-izquierda
    if (balance > 1 && val < node.left.n.innerHTML) {
        node = rightRotate(node);
        return node;
    }

    // rotación derecha-derecha
    else if (balance < -1 && val > node.right.n.innerHTML) {
        node = leftRotate(node);
        return node;
    }

    if (balance > 1 && val > node.left.n.innerHTML) {
        node.left = leftRotate(node.left);
        node = rightRotate(node);
        return node;
    }

    // caso derecha-izquierda
    if (balance < -1 && val < node.right.n.innerHTML) {
        node.right = rightRotate(node.right);
        node = leftRotate(node);
        return node;
    }

    return node;
}
}
