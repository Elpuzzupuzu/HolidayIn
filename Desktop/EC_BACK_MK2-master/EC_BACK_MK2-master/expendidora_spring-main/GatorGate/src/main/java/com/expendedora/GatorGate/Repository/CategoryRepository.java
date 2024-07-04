package com.expendedora.GatorGate.Repository;


import com.expendedora.GatorGate.Model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}

