package com.example._blog.Service;

import static org.springframework.http.HttpStatus.NOT_FOUND;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example._blog.Entity.Blog;
import com.example._blog.Entity.Notification;
import com.example._blog.Entity.User;
import com.example._blog.Entity.enums.NotificationType;
import com.example._blog.Repositories.FollowRepo;
import com.example._blog.Repositories.NotificationRepo;

@Service
public class NotificationService {
    private final NotificationRepo notificationRepo;
    private final FollowRepo followRepo;

    public NotificationService(NotificationRepo notificationRepo, FollowRepo followRepo) {
        this.notificationRepo = notificationRepo;
        this.followRepo = followRepo;
    }

    @Transactional
    public void notifyLike(Blog blog, User actor) {
        if (blog == null || blog.getUser() == null || actor == null) {
            return;
        }
        Long recipientId = blog.getUser().getUserId();
        Long actorId = actor.getUserId();
        if (recipientId == null || actorId == null || recipientId.equals(actorId)) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(blog.getUser())
                .actor(actor)
                .blog(blog)
                .type(NotificationType.LIKE)
                .message(actor.getUserName() + " liked your post.")
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepo.save(notification);
    }

    @Transactional
    public void notifyComment(Blog blog, User actor) {
        if (blog == null || blog.getUser() == null || actor == null) {
            return;
        }
        Long recipientId = blog.getUser().getUserId();
        Long actorId = actor.getUserId();
        if (recipientId == null || actorId == null || recipientId.equals(actorId)) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(blog.getUser())
                .actor(actor)
                .blog(blog)
                .type(NotificationType.COMMENT)
                .message(actor.getUserName() + " commented on your post.")
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepo.save(notification);
    }

    @Transactional
    public void notifyFollow(User follower, User followed) {
        if (follower == null || followed == null || follower.getUserId() == null || followed.getUserId() == null) {
            return;
        }
        if (follower.getUserId().equals(followed.getUserId())) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(followed)
                .actor(follower)
                .blog(null)
                .type(NotificationType.FOLLOW)
                .message(follower.getUserName() + " started following you.")
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepo.save(notification);
    }

    @Transactional
    public void notifyNewPost(Blog blog) {
        if (blog == null || blog.getUser() == null || blog.getUser().getUserId() == null) {
            return;
        }
        Long authorUserId = blog.getUser().getUserId();
        List<Long> followerIds = followRepo.findFollowerIdsByFollowingId(authorUserId);
        if (followerIds == null || followerIds.isEmpty()) {
            return;
        }

        List<Notification> notifications = new ArrayList<>();
        for (Long followerId : followerIds) {
            if (followerId == null || followerId.equals(authorUserId)) {
                continue;
            }
            User recipient = User.builder().userId(followerId).build();
            Notification notification = Notification.builder()
                    .recipient(recipient)
                    .actor(blog.getUser())
                    .blog(blog)
                    .type(NotificationType.POST)
                    .message(blog.getUser().getUserName() + " published a new post.")
                    .isRead(false)
                    .createdAt(Instant.now())
                    .build();
            notifications.add(notification);
        }
        if (!notifications.isEmpty()) {
            notificationRepo.saveAll(notifications);
        }
    }

    public List<Notification> getMyNotifications(Long userId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        Pageable pageable = PageRequest.of(0, safeLimit);
        return notificationRepo.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepo.countByRecipientUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepo.findByIdAndRecipientUserId(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notification not found"));
        notification.setRead(true);
        notificationRepo.save(notification);
    }

    @Transactional
    public void markUnread(Long userId, Long notificationId) {
        Notification notification = notificationRepo.findByIdAndRecipientUserId(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Notification not found"));
        notification.setRead(false);
        notificationRepo.save(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        List<Notification> unread = notificationRepo.findByRecipientUserIdAndIsReadFalse(userId);
        if (unread.isEmpty()) {
            return;
        }
        unread.forEach((item) -> item.setRead(true));
        notificationRepo.saveAll(unread);
    }
}
