package com.example._blog.Controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Dto.BlogResponse;
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
    public ResponseEntity<Page<BlogResponse>> getFeed(@AuthenticationPrincipal UserPrincipal principal,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(blogService.getFeedResponses(currentUserId, page, size));
    }

    @GetMapping("/me")
    public ResponseEntity<Page<BlogResponse>> getMyBlogs(@AuthenticationPrincipal UserPrincipal principal,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(blogService.getMyBlogsResponses(currentUserId, page, size));
    }

    @GetMapping("/me/count")
    public ResponseEntity<CountResponse> getMyBlogCount(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(new CountResponse(blogService.getMyBlogCount(currentUserId)));
    }

    public record CountResponse(long count) {}
}
