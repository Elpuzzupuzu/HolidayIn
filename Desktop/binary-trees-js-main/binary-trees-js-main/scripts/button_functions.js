const bst = new BinarySearchTree(); // Creación del objeto

function insertButton() {
  addNum = document.getElementById("Num");
  bst.insert(parseInt(Math.abs(addNum.value))); // Se envía un valor numérico entero positivo
  var root = bst.getRootNode(); // getRootNode retorna this.root
  bst.inorder(root); // Ayuda con la consola
  addNum.value = "";
}

function findButton() {
  findNum = document.getElementById("Num");

  var root = bst.getRootNode();
  var x = bst.find(root, parseInt(Math.abs(findNum.value))); // Retorna el nodo si se encuentra

  if (x != null) {
    x.n.classList.add("foundNode"); // Cambia el color a amarillo e imprime
    alert("El elemento " + findNum.value + " ha sido encontrado");
  } else {
    alert("El elemento " + findNum.value + " no ha sido encontrado");
  }
  findNum.value = "";
}

function printButton() {
  var poljeIspis = document.getElementById("poljeIspis");
  poljeIspis.innerHTML += '<br>' + 'Impresión en orden' + '<br>'; // Pega en la parte inferior de la pantalla
  var root = bst.getRootNode();
  bst.inorder(root); // Consola
  bst.ispis(root); // Impresión en la pantalla
  alert("Las impresiones están en la parte inferior de la pantalla");

  poljeIspis.innerHTML += '<br>' + 'Impresión en preorder' + '<br>'; // Pega en la parte inferior de la pantalla
  bst.ispisPreorder(root); // Impresión en la pantalla

  poljeIspis.innerHTML += '<br>' + 'Impresión en postorder' + '<br>'; // Pega en la parte inferior de la pantalla
  bst.ispisPostorder(root); // Impresión en la pantalla
}

function minButton() {
  var root = bst.getRootNode();
  if (root != null) {
    var min = bst.findMinNode(root); // Se envía la raíz a la función auxiliar findMinNode en tree.js
    alert("El elemento más pequeño es " + min.data);
  } else {
    alert("El árbol está vacío");
  }
}

function maxButton() {
  var root = bst.getRootNode();

  if (root != null) {
    var max = bst.findMaxNode(root);
    alert("El elemento más grande es " + max.data);
  } else {
    alert("El árbol está vacío");
  }
}

function deleteButton() {
  var deleteNum = document.getElementById("Num");
  var root = bst.getRootNode();

  if (!bst.isthere(root, deleteNum.value)) {
    bst.remove(parseInt(Math.abs(deleteNum.value)));
    bst.inorder(root);
  } else {
    alert("El elemento no existe");
  }
  deleteNum.value = "";
}

//////////////////////////////////////////AVL/////////////////////////////////////////////////////////
function insertButtonAVL() {
  addNum = document.getElementById("Num");

  bst.insertAVL(parseInt(Math.abs(addNum.value)));

  var root = bst.getRootNode();
  bst.inorder(root);

  addNum.value = ""; // Eliminar número del cuadro de entrada
  clearCanvas(); // Eliminar líneas

  ChangePos(root, window.innerWidth / 2, rootPosition); // Cambiar posición en la imagen
}

function deleteButtonAVL() {
  var deleteNum = document.getElementById("Num");
  var root = bst.getRootNode();

  if (!bst.isthere(root, deleteNum.value)) {
    bst.removeAVL(parseInt(Math.abs(deleteNum.value)));
    bst.inorder(root);
  } else {
    alert("El elemento no existe");
  }

  deleteNum.value = "";
}
