package com.example._blog.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Dto.response.BlogResponse;
import com.example._blog.Security.UserPrincipal;
import com.example._blog.Service.BlogService;

@RestController
@RequestMapping("/api/blogs")
public class FeedCont {
    private final BlogService blogService;

    public FeedCont(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping("/feed")
    public ResponseEntity<List<BlogResponse>> getFeed(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(blogService.getFeedResponses(currentUserId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<BlogResponse>> getMyBlogs(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(blogService.getMyBlogsResponses(currentUserId));
    }

    @GetMapping("/me/count")
    public ResponseEntity<CountResponse> getMyBlogCount(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(new CountResponse(blogService.getMyBlogCount(currentUserId)));
    }

    public record CountResponse(long count) {}
}
