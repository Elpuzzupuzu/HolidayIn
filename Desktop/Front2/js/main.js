// Función para obtener los productos resumidos
async function getProductSummaries() {
    try {
        const response = await fetch('http://localhost:8080/products/summary');
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        console.log('Product Summaries:', data);

        // Retornar los productos
        return data;
    } catch (error) {
        console.error('Error fetching product summaries:', error);
        return [];
    }
}

// Función para cargar los productos después de que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    cargarProductos();
});

async function cargarProductos() {
    try {
        const products = await getProductSummaries();
        const contenedorProductos = document.querySelector("#contenedor-productos");

        if (!contenedorProductos) {
            console.error('Contenedor de productos no encontrado en el DOM');
            return;
        }

        products.forEach(product => {
            const div = document.createElement("div");
            div.classList.add("product");
            div.innerHTML = `
                <img class="producto-imagen" src="${product.img}" alt="">
                <div class="producto-detalles">
                    <h3 class="producto-titulo">${product.name}</h3>
                    <p class="producto-precio">${product.price}</p>
                    <button class="producto-agregar">Agregar</button>
                </div>
            `;
            contenedorProductos.append(div);
        });
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}
