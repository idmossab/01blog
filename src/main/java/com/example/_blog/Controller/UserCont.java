package com.example._blog.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Entity.User;
import com.example._blog.Service.UserService;

@RestController
@RequestMapping("/users")
public class UserCont {

    private final UserService service;

    public UserCont(UserService service) {
        this.service = service;
    }

    //REGISTER
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        User created = service.register(user);
        return ResponseEntity.ok(created);
    }

    //LOGIN (email OR username)
    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestParam String emailOrUsername,
                                      @RequestParam String password) {
        User u = service.login(emailOrUsername, password);
        return ResponseEntity.ok(u);
    }
}
