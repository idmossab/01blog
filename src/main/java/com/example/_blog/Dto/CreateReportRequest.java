package com.example._blog.Dto;

import com.example._blog.Entity.enums.ReportReason;

public class CreateReportRequest {
    private Long blogId;
    private ReportReason reason;
    private String details;

    public Long getBlogId() {
        return blogId;
    }

    public void setBlogId(Long blogId) {
        this.blogId = blogId;
    }

    public ReportReason getReason() {
        return reason;
    }

    public void setReason(ReportReason reason) {
        this.reason = reason;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
