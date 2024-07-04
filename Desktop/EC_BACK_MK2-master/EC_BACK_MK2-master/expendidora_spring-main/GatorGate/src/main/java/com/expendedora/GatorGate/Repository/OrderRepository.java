package com.expendedora.GatorGate.Repository;

import com.expendedora.GatorGate.Model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}

