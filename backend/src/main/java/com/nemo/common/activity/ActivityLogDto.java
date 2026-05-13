package com.nemo.common.activity;

public record ActivityLogDto(
        Long id,
        String username,
        String method,
        String path,
        Integer status,
        String ip,
        Long duration,
        String createdAt
) {}