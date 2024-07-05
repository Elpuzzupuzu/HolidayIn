package com.expendedora.GatorGate.Service;

import com.expendedora.GatorGate.Model.Admin;
import com.expendedora.GatorGate.Repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    public Admin createAdmin(String email, String password, String name, String lastname) {
        Admin admin = new Admin();
        admin.setEmail(email);
        admin.setPassword(password);
        admin.setName(name);
        admin.setLastname(lastname);
        return adminRepository.save(admin);
    }

    public Admin getAdminById(Long id) {
        Optional<Admin> admin = adminRepository.findById(id);
        return admin.orElse(null);
    }

    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    public Admin updateAdmin(Long id, String email, String password, String name, String lastname) {
        Optional<Admin> optionalAdmin = adminRepository.findById(id);
        if (optionalAdmin.isPresent()) {
            Admin admin = optionalAdmin.get();
            admin.setEmail(email);
            admin.setPassword(password);
            admin.setName(name);
            admin.setLastname(lastname);
            return adminRepository.save(admin);
        } else {
            return null;
        }
    }

    public void deleteAdmin(Long id) {
        adminRepository.deleteById(id);
    }

    public Admin authenticateAdmin(String email, String password) {
        Optional<Admin> optionalAdmin = adminRepository.findByEmail(email);
        if (optionalAdmin.isPresent() && optionalAdmin.get().getPassword().equals(password)) {
            return optionalAdmin.get();
        } else {
            return null;
        }
    }





}// fin controller
