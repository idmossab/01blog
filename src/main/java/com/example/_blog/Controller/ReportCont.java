package com.example._blog.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example._blog.Dto.request.CreateReportRequest;
import com.example._blog.Security.UserPrincipal;
import com.example._blog.Service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportCont {
    private final ReportService reportService;

    public ReportCont(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(@AuthenticationPrincipal UserPrincipal principal,
                                                       @RequestBody CreateReportRequest request) {
        Long reporterUserId = principal.getUser().getUserId();
        Long reportId = reportService.create(reporterUserId, request);
        return ResponseEntity.ok(new ReportResponse(reportId, "Report submitted. Thank you."));
    }

    public record ReportResponse(Long reportId, String message) {}
}
