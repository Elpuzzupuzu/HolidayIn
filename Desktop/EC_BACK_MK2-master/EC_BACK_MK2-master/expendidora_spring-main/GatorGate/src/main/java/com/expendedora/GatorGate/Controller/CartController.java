package com.expendedora.GatorGate.Controller;

import com.expendedora.GatorGate.Model.Cart;
import com.expendedora.GatorGate.Service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping("/{userId}")
    public ResponseEntity<Cart> getCartByUserId(@PathVariable Long userId) {
        Cart cart = cartService.getCartByUserId(userId);

        if (cart == null) {
            return ResponseEntity.notFound().build();
        } else {
            return ResponseEntity.ok(cart);
        }
    }

    @GetMapping("/{userId}/cartId")
    public ResponseEntity<Long> getCartIdByUserId(@PathVariable Long userId) {
        Cart cart = cartService.getCartByUserId(userId);

        if (cart == null) {
            return ResponseEntity.notFound().build();
        } else {
            return ResponseEntity.ok(cart.getId());
        }
    }

    @PostMapping("/add")
    public void addItemToCart(@RequestParam Long userId, @RequestParam Long productId, @RequestParam Integer quantity) {
        cartService.addItemToCart(userId, productId, quantity);
    }

    // Método para crear un carrito para un usuario
    @PostMapping("/create")
    public ResponseEntity<Cart> createCartForUser(@RequestParam Long userId) {
        Cart cart = cartService.createCartForUser(userId);
        return ResponseEntity.ok(cart);
    }
}
