package com.expendedora.GatorGate.Controller;

import com.expendedora.GatorGate.Model.Admin;
import com.expendedora.GatorGate.Service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/admins")
public class AdminController {



    @PostMapping("/login")
    public Admin login(@RequestBody Admin admin) {
        Admin authenticatedAdmin = adminService.authenticateAdmin(admin.getEmail(), admin.getPassword());
        if (authenticatedAdmin != null) {
            return authenticatedAdmin;
        } else {
            throw new RuntimeException("Invalid email or password");
        }
    }





    @Autowired
    private AdminService adminService;

    @PostMapping("/create")
    public Admin createAdmin(@RequestBody Admin admin) {
        return adminService.createAdmin(admin.getEmail(), admin.getPassword(), admin.getName(), admin.getLastname());
    }

    @GetMapping("/{id}")
    public Admin getAdminById(@PathVariable Long id) {
        return adminService.getAdminById(id);
    }

    @GetMapping
    public List<Admin> getAllAdmins() {
        return adminService.getAllAdmins();
    }

    @PutMapping("/{id}")
    public Admin updateAdmin(@PathVariable Long id, @RequestBody Admin admin) {
        return adminService.updateAdmin(id, admin.getEmail(), admin.getPassword(), admin.getName(), admin.getLastname());
    }

    @DeleteMapping("/{id}")
    public void deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
    }
}
