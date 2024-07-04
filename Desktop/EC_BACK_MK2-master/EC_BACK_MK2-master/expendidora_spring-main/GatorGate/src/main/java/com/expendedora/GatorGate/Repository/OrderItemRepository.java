package com.expendedora.GatorGate.Repository;

import com.expendedora.GatorGate.Model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
