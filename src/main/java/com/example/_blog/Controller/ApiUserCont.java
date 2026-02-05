package com.example._blog.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Dto.UserResponse;
import com.example._blog.Security.UserPrincipal;
import com.example._blog.Service.UserService;

@RestController
@RequestMapping("/api/users")
public class ApiUserCont {
    private final UserService userService;

    public ApiUserCont(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(userService.getById(currentUserId));
    }
}
