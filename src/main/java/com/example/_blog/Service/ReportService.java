package com.example._blog.Service;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example._blog.Dto.CreateReportRequest;
import com.example._blog.Entity.Blog;
import com.example._blog.Entity.Report;
import com.example._blog.Entity.User;
import com.example._blog.Repositories.BlogRepo;
import com.example._blog.Repositories.ReportRepo;
import com.example._blog.Repositories.UserRepo;

@Service
public class ReportService {
    private static final int MAX_DETAILS_LENGTH = 500;

    private final ReportRepo reportRepo;
    private final BlogRepo blogRepo;
    private final UserRepo userRepo;

    public ReportService(ReportRepo reportRepo, BlogRepo blogRepo, UserRepo userRepo) {
        this.reportRepo = reportRepo;
        this.blogRepo = blogRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public Long create(Long reporterUserId, CreateReportRequest request) {
        if (request == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid report request");
        }
        if (request.getReason() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Report reason is required");
        }
        boolean hasBlogTarget = request.getBlogId() != null;
        boolean hasUserTarget = request.getReportedUserId() != null;
        if (hasBlogTarget == hasUserTarget) {
            throw new ResponseStatusException(BAD_REQUEST, "Provide exactly one target: blogId or reportedUserId");
        }

        String details = request.getDetails() == null ? null : request.getDetails().trim();
        if (details != null && details.length() > MAX_DETAILS_LENGTH) {
            throw new ResponseStatusException(BAD_REQUEST, "Additional details cannot exceed 500 characters");
        }

        User reporter = userRepo.findById(reporterUserId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
        Report.ReportBuilder reportBuilder = Report.builder()
                .reporter(reporter)
                .reason(request.getReason())
                .details((details == null || details.isBlank()) ? null : details)
                .createdAt(Instant.now());

        if (hasBlogTarget) {
            Blog blog = blogRepo.findById(request.getBlogId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Blog not found"));
            if (blog.getUser() != null && reporterUserId.equals(blog.getUser().getUserId())) {
                throw new ResponseStatusException(BAD_REQUEST, "You cannot report your own post");
            }
            reportBuilder.blog(blog);
        }

        if (hasUserTarget) {
            User reportedUser = userRepo.findById(request.getReportedUserId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
            if (reporterUserId.equals(reportedUser.getUserId())) {
                throw new ResponseStatusException(BAD_REQUEST, "You cannot report yourself");
            }
            reportBuilder.reportedUser(reportedUser);
        }

        return reportRepo.save(reportBuilder.build()).getId();
    }
}
