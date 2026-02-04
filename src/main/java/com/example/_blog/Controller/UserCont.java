package com.example._blog.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.example._blog.Dto.UserLoginRequest;
import com.example._blog.Dto.UserRegisterRequest;
import com.example._blog.Dto.UserResponse;
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
    public ResponseEntity<UserResponse> register(@RequestBody @Valid UserRegisterRequest req) {
        UserResponse created = service.register(req);
        return ResponseEntity.ok(created);
    }

    //LOGIN (email OR username)
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody @Valid UserLoginRequest req) {
        UserResponse u = service.login(req);
        return ResponseEntity.ok(u);
    }
}
