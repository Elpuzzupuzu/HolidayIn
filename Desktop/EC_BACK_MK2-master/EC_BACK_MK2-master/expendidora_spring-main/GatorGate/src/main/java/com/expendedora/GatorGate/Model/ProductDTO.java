package com.expendedora.GatorGate.Model;


import jakarta.persistence.Transient;

public class ProductDTO {
    private long id;
    private String name;
    private String img;
    private String description;

    private Integer stock;
    @Transient
    private Integer sold;
    private Double price;



    // Constructor
    public ProductDTO(Long id, String name, String img, String description, Integer stock,Integer sold,Double price) {
        this.id= id;
        this.name = name;
        this.img = img;
        this.description = description;
        this.sold=sold;
        this.stock=stock;

        this.price = price;
    }

    // Getters y setters


    public long getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImg() {
        return img;
    }

    public void setImg(String img) {
        this.img = img;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }


    public Integer getSold() {
        return sold;
    }

    public void setSold(Integer sold) {
        this.sold = sold;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }
}
