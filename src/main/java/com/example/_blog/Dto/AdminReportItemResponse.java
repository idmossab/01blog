package com.example._blog.Dto;

import java.time.Instant;

import com.example._blog.Entity.enums.ReportReason;

public record AdminReportItemResponse(
        Long reportId,
        ReportReason reason,
        String details,
        Instant createdAt,
        Long reporterUserId,
        String reporterUserName,
        Long blogId,
        String blogTitle,
        String blogContent,
        Long blogAuthorUserId,
        String blogAuthorUserName,
        Long reportedUserId,
        String reportedUserName
) {
}
