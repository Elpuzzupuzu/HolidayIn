package com.expendedora.GatorGate.Model;
import jakarta.persistence.*;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Date orderDate;

    @OneToMany(mappedBy = "order")
    private List<OrderItem> orderItems;

    // Getters y setters
}
