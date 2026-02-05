package com.example._blog;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.test.context.ActiveProfiles;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.BlogStatus;
import com.example._blog.Entity.enums.UserRole;
import com.example._blog.Entity.enums.UserStatus;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.FollowRepo;
import com.example._blog.Repositories.UserRepo;
import com.example._blog.Service.BlogService;
import com.example._blog.Service.FollowService;

@SpringBootTest
@ActiveProfiles("test")
class FollowFeedServiceTests {
    @Autowired
    private UserRepo userRepo;

    @Autowired
    private BlogRepo blogRepo;

    @Autowired
    private FollowRepo followRepo;

    @Autowired
    private FollowService followService;

    @Autowired
    private BlogService blogService;

    @AfterEach
    void cleanup() {
        followRepo.deleteAll();
        blogRepo.deleteAll();
        userRepo.deleteAll();
    }

    @Test
    void followAndUnfollowUpdatesFollowingList() {
        User alice = createUser("alice");
        User bob = createUser("bob");

        followService.followUser(alice.getUserId(), bob.getUserId());
        List<Long> following = followService.getFollowingIds(alice.getUserId());
        assertEquals(List.of(bob.getUserId()), following);

        followService.unfollowUser(alice.getUserId(), bob.getUserId());
        List<Long> after = followService.getFollowingIds(alice.getUserId());
        assertEquals(List.of(), after);
    }

    @Test
    void feedIncludesOnlySelfAndFollowedUsers() {
        User alice = createUser("alice");
        User bob = createUser("bob");
        User charlie = createUser("charlie");

        Blog aliceBlog = createBlog(alice, "A1");
        Blog bobBlog = createBlog(bob, "B1");
        Blog charlieBlog = createBlog(charlie, "C1");

        followService.followUser(alice.getUserId(), bob.getUserId());

        Page<Blog> feed = blogService.getFeed(alice.getUserId(), 0, 20);
        List<Long> ids = feed.map(Blog::getIdBlog).toList();
        assertEquals(2, ids.size());
        assertEquals(true, ids.contains(aliceBlog.getIdBlog()));
        assertEquals(true, ids.contains(bobBlog.getIdBlog()));
        assertEquals(false, ids.contains(charlieBlog.getIdBlog()));

        followService.unfollowUser(alice.getUserId(), bob.getUserId());
        Page<Blog> after = blogService.getFeed(alice.getUserId(), 0, 20);
        List<Long> afterIds = after.map(Blog::getIdBlog).toList();
        assertEquals(1, afterIds.size());
        assertEquals(true, afterIds.contains(aliceBlog.getIdBlog()));
        assertEquals(false, afterIds.contains(bobBlog.getIdBlog()));
        assertEquals(false, afterIds.contains(charlieBlog.getIdBlog()));
    }

    private User createUser(String prefix) {
        User user = User.builder()
                .firstName(prefix)
                .lastName("User")
                .userName(prefix + "_" + System.nanoTime())
                .email(prefix + System.nanoTime() + "@example.com")
                .password("password")
                .status(UserStatus.ACTIVE)
                .role(UserRole.USER)
                .build();
        return userRepo.save(user);
    }

    private Blog createBlog(User user, String title) {
        Blog blog = Blog.builder()
                .title(title)
                .content("Content " + title)
                .status(BlogStatus.ACTIVE)
                .user(user)
                .createdAt(Instant.now())
                .build();
        return blogRepo.save(blog);
    }
}
