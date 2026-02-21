package com.example._blog.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example._blog.Entity.Report;

@Repository
public interface ReportRepo extends JpaRepository<Report, Long> {
    void deleteByBlogIdBlog(Long blogId);
    void deleteByReporterUserIdOrReportedUserUserId(Long reporterUserId, Long reportedUserUserId);
}
