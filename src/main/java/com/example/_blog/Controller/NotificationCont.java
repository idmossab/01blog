package com.example._blog.Controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Entity.Notification;
import com.example._blog.Entity.enums.NotificationType;
import com.example._blog.Security.UserPrincipal;
import com.example._blog.Service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationCont {
    private final NotificationService notificationService;

    public NotificationCont(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<NotificationItem>> getMyNotifications(@AuthenticationPrincipal UserPrincipal principal,
                                                                     @RequestParam(defaultValue = "20") int limit) {
        Long currentUserId = principal.getUser().getUserId();
        List<NotificationItem> items = notificationService.getMyNotifications(currentUserId, limit)
                .stream()
                .map(this::toItem)
                .toList();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.getUnreadCount(currentUserId)));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long notificationId) {
        Long currentUserId = principal.getUser().getUserId();
        notificationService.markRead(currentUserId, notificationId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        Long currentUserId = principal.getUser().getUserId();
        notificationService.markAllRead(currentUserId);
        return ResponseEntity.noContent().build();
    }

    private NotificationItem toItem(Notification notification) {
        Long actorUserId = notification.getActor() == null ? null : notification.getActor().getUserId();
        String actorName = notification.getActor() == null ? null : notification.getActor().getUserName();
        Long blogId = notification.getBlog() == null ? null : notification.getBlog().getIdBlog();
        return new NotificationItem(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt(),
                actorUserId,
                actorName,
                blogId
        );
    }

    public record NotificationItem(
            Long id,
            NotificationType type,
            String message,
            boolean read,
            Instant createdAt,
            Long actorUserId,
            String actorUserName,
            Long blogId
    ) {}

    public record UnreadCountResponse(long count) {}
}
