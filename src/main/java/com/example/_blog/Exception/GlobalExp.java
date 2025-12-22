package com.example._blog.Exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
@ControllerAdvice
public class GlobalExp {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception ex) {
        // Log the exception details (you can use a logging framework here)
        ex.printStackTrace();
        System.err.println(ex.getClass().getName());
        return ResponseEntity.status(500).body("An internal error occurred. Please try again later.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<String> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        // Log the exception details (you can use a logging framework here)
        System.err.println("An error occurred: " + ex.getMessage());
        System.err.println(ex.getClass().getName());
        return ResponseEntity.status(403).body("you have provided invalid input. Please check and try again.");
    }
}
