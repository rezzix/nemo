package com.nemo.sprint;

import java.time.LocalDate;
import java.util.List;

public record SprintBurndownDto(
        Long sprintId,
        String sprintName,
        LocalDate startDate,
        LocalDate endDate,
        int totalStoryPoints,
        List<DataPoint> data
) {
    public record DataPoint(
            String date,
            double idealRemaining,
            double actualRemaining
    ) {}
}