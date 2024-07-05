package com.expendedora.GatorGate.Controller;

import com.expendedora.GatorGate.Model.CartItem;
import com.expendedora.GatorGate.Model.CartItemDTO;
import com.expendedora.GatorGate.Service.CartItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart-items")
public class CartItemController {

    private final CartItemService cartItemService;

    @Autowired
    public CartItemController(CartItemService cartItemService) {
        this.cartItemService = cartItemService;
    }

    // Endpoint para agregar un item al carrito
    @PostMapping("/add")
    public ResponseEntity<CartItemDTO> addItemToCart(@RequestParam Long cartId, @RequestParam Long productId, @RequestParam Integer quantity) {
        try {
            CartItemDTO cartItem = cartItemService.addItemToCart(cartId, productId, quantity);
            return ResponseEntity.status(HttpStatus.CREATED).body(cartItem);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }



}/// fin controller
 //// version mk3