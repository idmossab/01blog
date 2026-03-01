package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import com.example._blog.Dto.response.AuthResponse;
import com.example._blog.Dto.request.UserLoginRequest;
import com.example._blog.Dto.request.UserRegisterRequest;
import com.example._blog.Dto.response.UserResponse;
import com.example._blog.Security.UserPrincipal;
import com.example._blog.Service.UserService;

@RestController
@RequestMapping({"/users", "/api/users"})
public class UserCont {

    private final UserService service;

    public UserCont(UserService service) {
        this.service = service;
    }

    //REGISTER
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid UserRegisterRequest req) {
        AuthResponse created = service.register(req);
        return ResponseEntity.ok(created);
    }

    //LOGIN (email OR username)
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid UserLoginRequest req) {
        AuthResponse u = service.login(req);
        return ResponseEntity.ok(u);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getById(userId));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getUser() == null || principal.getUser().getUserId() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(service.getById(currentUserId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> update(@PathVariable Long userId,
                                               @RequestBody @Valid UserRegisterRequest req) {
        return ResponseEntity.ok(service.update(userId, req));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> delete(@PathVariable Long userId) {
        service.delete(userId);
        return ResponseEntity.noContent().build();
    }
}
