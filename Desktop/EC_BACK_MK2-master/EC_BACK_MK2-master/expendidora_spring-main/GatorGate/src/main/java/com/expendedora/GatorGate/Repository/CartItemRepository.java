package com.expendedora.GatorGate.Repository;

import com.expendedora.GatorGate.Model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

}
