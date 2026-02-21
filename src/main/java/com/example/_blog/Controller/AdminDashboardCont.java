package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Dto.BlogResponse;
import com.example._blog.Dto.UserResponse;
import com.example._blog.Entity.enums.UserStatus;
import com.example._blog.Service.BlogService;
import com.example._blog.Service.ReportService;
import com.example._blog.Service.UserService;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardCont {
    private final UserService userService;
    private final BlogService blogService;
    private final ReportService reportService;

    public AdminDashboardCont(UserService userService, BlogService blogService, ReportService reportService) {
        this.userService = userService;
        this.blogService = blogService;
        this.reportService = reportService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(userService.getAll());
    }

    @PutMapping("/users/{userId}/status/{status}")
    public ResponseEntity<UserResponse> updateUserStatus(@PathVariable Long userId, @PathVariable UserStatus status) {
        return ResponseEntity.ok(userService.updateStatus(userId, status));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<BlogResponse>> getPosts() {
        return ResponseEntity.ok(blogService.getAllResponses());
    }

    @GetMapping("/reports/count")
    public ResponseEntity<CountResponse> getReportsCount() {
        return ResponseEntity.ok(new CountResponse(reportService.countAll()));
    }

    public record CountResponse(long count) {}
}
