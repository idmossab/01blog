package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Security.UserPrincipal;
import com.example._blog.Service.FollowService;

@RestController
@RequestMapping("/api/follows")
public class FollowCont {
    private final FollowService service;

    public FollowCont(FollowService service) {
        this.service = service;
    }

    @PostMapping("/{userId}")
    public ResponseEntity<FollowResponse> follow(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable Long userId) {
        Long currentUserId = principal.getUser().getUserId();
        service.followUser(currentUserId, userId);
        return ResponseEntity.ok(new FollowResponse("followed", userId));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<FollowResponse> unfollow(@AuthenticationPrincipal UserPrincipal principal,
                                                   @PathVariable Long userId) {
        Long currentUserId = principal.getUser().getUserId();
        service.unfollowUser(currentUserId, userId);
        return ResponseEntity.ok(new FollowResponse("unfollowed", userId));
    }

    @GetMapping("/me/following")
    public ResponseEntity<List<Long>> getFollowing(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(service.getFollowingIds(currentUserId));
    }

    public record FollowResponse(String message, Long followingUserId) {}
}
