package app.Controller;


import app.Model.Category;
import app.Model.Product;
import app.Model.ProductDTO;
import app.Model.ProductRequest;
import app.Service.CategoryService;
import app.Service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000") // Ajusta el origen según sea necesario
@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;
    @Autowired
    private CategoryService categoryService;

    // Método para actualizar un producto
    @PutMapping("/update/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody ProductRequest productRequest) {
        Product updatedProduct = productService.updateProduct(id, productRequest);
        return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
    }

    // Método para crear un nuevo producto
    @PostMapping("/create")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product createdProduct = productService.createProduct(product);
        return new ResponseEntity<>(createdProduct, HttpStatus.CREATED);
    }

    // Método alternativo para crear un producto
    @PostMapping("/create2")
    public ResponseEntity<Product> createProduct2(@RequestBody ProductRequest product) {
        Product p = new Product();
        p.setImg(product.getImg());
        p.setName(product.getName());
        p.setDescription(product.getDescription());
        p.setPrice(product.getPrice());
        p.setStock(product.getStock());

        long id_category = product.getId_category();
        Category category = categoryService.getCategoryById(id_category);

        p.setCategory(category);
        Product createdProduct = productService.createProduct(p);

        return new ResponseEntity<>(createdProduct, HttpStatus.CREATED);
    }

    // Método para realizar compras
    @PostMapping("/purchase")
    public ResponseEntity<String> purchaseProducts(@RequestBody List<ProductDTO> products) {
        try {
            productService.purchaseProducts(products);
            return ResponseEntity.ok("Purchase successful");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing purchase");
        }
    }

    // Método para obtener un resumen de todos los productos
    @GetMapping("/summary")
    public List<ProductDTO> getAllProductSummaries() {
        List<Product> products = productService.getAllProducts();
        return products.stream()
                .map(product -> new ProductDTO(
                        product.getId(),
                        product.getName(),
                        product.getImg(),
                        product.getDescription(),
                        product.getSold(),
                        product.getStock(),
                        product.getPrice()))
                .collect(Collectors.toList());
    }

    // Método alternativo para obtener un resumen de todos los productos
    @GetMapping("/summary2")
    public List<ProductDTO> getAllProductSummaries2() {
        List<Product> products = productService.getAllProducts();
        return products.stream()
                .map(product -> new ProductDTO(
                        product.getId(),
                        product.getName(),
                        product.getImg(),
                        product.getDescription(),
                        product.getSold(),
                        product.getStock(),
                        product.getPrice()))
                .collect(Collectors.toList());
    }

    ///////////////////// TESTING DE LA PAGINACION posible candidato a ser definitivo 10/07/2024:


    @GetMapping("/page")
    public ResponseEntity<Page<Product>> getAllProducts(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "5") int size) {
        Page<Product> productsPage = productService.getAllProducts(page, size);
        return ResponseEntity.ok().body(productsPage);

    }


    /// PARA LA VERSION POR CATEGORIAS///








    ////////////////////////////////

    // Método para obtener todos los productos
    @GetMapping("/getall")
    public List<Product> getAllProducts() {
        return productService.getAllProducts();
    }

    // Método para obtener un producto por su ID
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    // Método para buscar productos por palabra clave
    @GetMapping("/search")
    public List<Product> searchProducts(@RequestParam String keyword) {
        return productService.searchProducts(keyword);
    }

    // Método para obtener productos por categoría
    @GetMapping("/by-category")
    public List<Product> getProductsByCategory(@RequestParam String categoryName) {
        return productService.getProductsByCategory(categoryName);
    }

    // Método para eliminar un producto por su ID
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return new ResponseEntity<>("Product deleted successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }
}
