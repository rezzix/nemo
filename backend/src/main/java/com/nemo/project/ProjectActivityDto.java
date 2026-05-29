package com.nemo.project;

public record ProjectActivityDto(
        String timestamp,
        String actorName,
        String eventType,
        String description
) {}