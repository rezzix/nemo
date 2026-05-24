package com.nemo.user;

import java.util.List;

public record AllocationSummaryDto(
        Long userId,
        int totalAllocation,
        List<ProjectAllocation> projects
) {
    public record ProjectAllocation(Long projectId, String projectName, int allocation) {}
}