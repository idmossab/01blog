package com.example._blog.Service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import com.example._blog.Entity.Follow;
import com.example._blog.Entity.User;
import com.example._blog.Repositories.FollowRepo;
import com.example._blog.Repositories.UserRepo;

@Service
public class FollowService {
    private final FollowRepo followRepo;
    private final UserRepo userRepo;
    private final NotificationService notificationService;

    public FollowService(FollowRepo followRepo, UserRepo userRepo,
                         NotificationService notificationService) {
        this.followRepo = followRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
    }

    @Transactional
    public void followUser(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new ResponseStatusException(BAD_REQUEST, "You cannot follow yourself");
        }
        if (followRepo.existsByFollowerUserIdAndFollowingUserId(currentUserId, targetUserId)) {
            throw new ResponseStatusException(CONFLICT, "Already following");
        }
        User follower = userRepo.findById(currentUserId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        User following = userRepo.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .createdAt(Instant.now())
                .build();
        followRepo.save(follow);
        notificationService.notifyFollow(follower, following);
    }

    @Transactional
    public void unfollowUser(Long currentUserId, Long targetUserId) {
        followRepo.deleteByFollowerUserIdAndFollowingUserId(currentUserId, targetUserId);
    }

    public List<Long> getFollowingIds(Long currentUserId) {
        return followRepo.findFollowingIdsByFollowerId(currentUserId);
    }

    public FollowCounts getFollowCounts(Long currentUserId) {
        long following = followRepo.countByFollowerUserId(currentUserId);
        long followers = followRepo.countByFollowingUserId(currentUserId);
        return new FollowCounts(following, followers);
    }

    public record FollowCounts(long following, long followers) {}
}
