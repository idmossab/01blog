package com.example._blog.Exception;

import java.time.Instant;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import jakarta.servlet.http.HttpServletRequest;
@ControllerAdvice
public class GlobalExp {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex, HttpServletRequest req) {
        ErrorResponse body = new ErrorResponse(Instant.now(), ex.getStatusCode().value(), ex.getReason(), req.getRequestURI());
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest req) {
        String msg = "Invalid input";
        if (ex.getBindingResult() != null && ex.getBindingResult().getFieldError() != null) {
            msg = ex.getBindingResult().getFieldError().getField() + " " +
                  ex.getBindingResult().getFieldError().getDefaultMessage();
        }
        return ResponseEntity.badRequest().body(new ErrorResponse(Instant.now(), 400, msg, req.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex, HttpServletRequest req) {
        // Log the exception details (you can use a logging framework here)
        ex.printStackTrace();
        System.err.println(ex.getClass().getName());
        return ResponseEntity.status(500)
                .body(new ErrorResponse(Instant.now(), 500, "An internal error occurred. Please try again later.", req.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        // Log the exception details (you can use a logging framework here)
        System.err.println("An error occurred: " + ex.getMessage());
        System.err.println(ex.getClass().getName());
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(Instant.now(), 400, "you have provided invalid input. Please check and try again.", req.getRequestURI()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(Instant.now(), 400, "Total media size exceeds 10MB", req.getRequestURI()));
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipartException(MultipartException ex, HttpServletRequest req) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(Instant.now(), 400, "Maximum 5 files allowed", req.getRequestURI()));
    }
}
