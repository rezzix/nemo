package com.nemo.common.dto;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(int status, String error, String message, Instant timestamp) {
    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(status, error, message, Instant.now());
    }
}