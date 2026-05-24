package com.nemo.leave;

public record LeaveBalanceDto(
        Long userId,
        String userName,
        String type,
        int year,
        int totalAllocated,
        int usedDays,
        int remainingDays
) {}