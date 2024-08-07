package app.Model;

public class ProductRequest {
    private String img;
    private String name;
    private String description; // Cambiar 'descripton' a 'description'
    private Double price;
    private Integer stock;
    private Long id_category;

    // Constructor vacío (necesario para deserialización JSON)
    public ProductRequest() {
    }

    // Getters y Setters
    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Long getId_category() {
        return id_category;
    }

    public void setId_category(Long id_category) {
        this.id_category = id_category;
    }

    public String getDescription() { // Cambiar 'getDescripton' a 'getDescription'
        return description;
    }

    public void setDescription(String description) { // Cambiar 'setDescripton' a 'setDescription'
        this.description = description;
    }
}
