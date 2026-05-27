package com.nemo.sprint;

public record SprintVelocityDto(
        Long sprintId,
        String sprintName,
        String status,
        int totalTasks,
        int completedTasks
) {}