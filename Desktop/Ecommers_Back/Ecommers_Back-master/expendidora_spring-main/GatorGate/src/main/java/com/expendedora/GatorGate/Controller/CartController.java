package com.expendedora.GatorGate.Controller;

import com.expendedora.GatorGate.Model.Cart;
import com.expendedora.GatorGate.Service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping("/{userId}")
    public Cart getCartByUserId(@PathVariable Long userId) {
        return cartService.getCartByUserId(userId);
    }

    @PostMapping("/add")
    public void addItemToCart(@RequestParam Long userId, @RequestParam Long productId, @RequestParam Integer quantity) {
        cartService.addItemToCart(userId, productId, quantity);
    }
}
