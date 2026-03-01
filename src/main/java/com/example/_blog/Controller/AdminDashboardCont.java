package com.example._blog.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Dto.response.BlogResponse;
import com.example._blog.Dto.response.AdminReportItemResponse;
import com.example._blog.Dto.response.UserResponse;
import com.example._blog.Entity.enums.BlogStatus;
import com.example._blog.Entity.enums.UserRole;
import com.example._blog.Entity.enums.UserStatus;
import com.example._blog.Service.BlogService;
import com.example._blog.Service.FollowService;
import com.example._blog.Service.ReportService;
import com.example._blog.Service.UserService;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardCont {
    private final UserService userService;
    private final BlogService blogService;
    private final FollowService followService;
    private final ReportService reportService;

    public AdminDashboardCont(UserService userService, BlogService blogService, FollowService followService, ReportService reportService) {
        this.userService = userService;
        this.blogService = blogService;
        this.followService = followService;
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

    @PutMapping("/users/{userId}/role/{role}")
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable Long userId, @PathVariable UserRole role) {
        return ResponseEntity.ok(userService.updateRole(userId, role));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<BlogResponse>> getPosts() {
        return ResponseEntity.ok(blogService.getAllResponses());
    }

    @PutMapping("/posts/{blogId}/status/{status}")
    public ResponseEntity<BlogResponse> updatePostStatus(@PathVariable Long blogId, @PathVariable BlogStatus status) {
        return ResponseEntity.ok(blogService.updateStatus(blogId, status));
    }

    @GetMapping("/followers-counts")
    public ResponseEntity<List<FollowerCountResponse>> getFollowersCounts() {
        List<UserResponse> users = userService.getAll();
        List<Long> userIds = users.stream().map(UserResponse::userId).toList();
        Map<Long, Long> counts = followService.getFollowerCounts(userIds);
        List<FollowerCountResponse> response = userIds.stream()
                .map(userId -> new FollowerCountResponse(userId, counts.getOrDefault(userId, 0L)))
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/count")
    public ResponseEntity<CountResponse> getReportsCount() {
        return ResponseEntity.ok(new CountResponse(reportService.countAll()));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<AdminReportItemResponse>> getReports() {
        return ResponseEntity.ok(reportService.getAllForAdmin());
    }

    public record FollowerCountResponse(Long userId, long count) {}
    public record CountResponse(long count) {}
}
