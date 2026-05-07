package com.jari.config;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, Long> {

    List<PublicHoliday> findByDateBetweenOrderByDateAsc(LocalDate start, LocalDate end);

    @Query("SELECT h FROM PublicHoliday h WHERE h.date BETWEEN :start AND :end " +
            "AND (h.company.id = :companyId OR h.company.id IS NULL) ORDER BY h.date ASC")
    List<PublicHoliday> findByDateBetweenAndCompanyOrGlobal(@Param("start") LocalDate start,
                                                            @Param("end") LocalDate end,
                                                            @Param("companyId") Long companyId);

    @Query("SELECT h FROM PublicHoliday h WHERE h.date BETWEEN :start AND :end " +
            "AND h.company.id IS NULL ORDER BY h.date ASC")
    List<PublicHoliday> findGlobalByDateBetween(@Param("start") LocalDate start,
                                                 @Param("end") LocalDate end);
}