package com.nemo.common.dto;

import java.time.Instant;
import java.util.List;

public record ValidationError(int status, String error, String message, List<FieldError> errors, Instant timestamp) {
    public static ValidationError of(String message, List<FieldError> errors) {
        return new ValidationError(422, "Validation Failed", message, errors, Instant.now());
    }

    public record FieldError(String field, String message) {}
}