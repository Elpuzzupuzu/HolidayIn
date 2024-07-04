package com.expendedora.GatorGate.Service;



import com.expendedora.GatorGate.Model.Cart;
import com.expendedora.GatorGate.Model.CartItem;
import com.expendedora.GatorGate.Model.Product;
import com.expendedora.GatorGate.Model.User;
import com.expendedora.GatorGate.Repository.CartRepository;
import com.expendedora.GatorGate.Repository.ProductRepository;
import com.expendedora.GatorGate.Repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;  // Cambia el nombre a "userRepository"

    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    public void addItemToCart(Long userId, Long productId, Integer quantity) {
        Cart cart = cartRepository.findByUserId(userId);
        if (cart == null) {
            cart = new Cart();
            User user = userRepository.findById(userId).orElse(null);  // Usa "userRepository" en lugar de "UserRepository"
            cart.setUser(user);
            cart = cartRepository.save(cart);
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product != null) {
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cart.getCartItems().add(cartItem);
            cartRepository.save(cart);
        }
    }
}
