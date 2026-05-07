package com.jari.config;

import com.jari.common.exception.EntityNotFoundException;
import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PublicHolidayService {

    private final PublicHolidayRepository holidayRepository;
    private final CompanyRepository companyRepository;

    public PublicHolidayService(PublicHolidayRepository holidayRepository, CompanyRepository companyRepository) {
        this.holidayRepository = holidayRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public List<PublicHoliday> listByYear(int year, Long companyId) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        if (companyId != null) {
            return holidayRepository.findByDateBetweenAndCompanyOrGlobal(start, end, companyId);
        }
        return holidayRepository.findByDateBetweenOrderByDateAsc(start, end);
    }

    @Transactional(readOnly = true)
    public List<PublicHoliday> listByDateRange(LocalDate start, LocalDate end, Long companyId) {
        if (companyId != null) {
            return holidayRepository.findByDateBetweenAndCompanyOrGlobal(start, end, companyId);
        }
        return holidayRepository.findByDateBetweenOrderByDateAsc(start, end);
    }

    @Transactional
    public PublicHoliday create(PublicHolidayDto.CreateRequest request) {
        Company company = request.companyId() != null
                ? companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()))
                : null;
        PublicHoliday holiday = new PublicHoliday();
        holiday.setDate(request.date());
        holiday.setName(request.name());
        holiday.setCompany(company);
        return holidayRepository.save(holiday);
    }

    @Transactional
    public PublicHoliday update(Long id, PublicHolidayDto.UpdateRequest request) {
        PublicHoliday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PublicHoliday", id));
        if (request.date() != null) holiday.setDate(request.date());
        if (request.name() != null) holiday.setName(request.name());
        if (request.companyId() != null) {
            Company company = companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
            holiday.setCompany(company);
        } else if (request.companyId() == null && request.name() != null) {
            // companyId explicitly set to null means global
            holiday.setCompany(null);
        }
        return holidayRepository.save(holiday);
    }

    @Transactional
    public void delete(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new EntityNotFoundException("PublicHoliday", id);
        }
        holidayRepository.deleteById(id);
    }

    public PublicHolidayDto toDto(PublicHoliday h) {
        return new PublicHolidayDto(
                h.getId(),
                h.getDate(),
                h.getName(),
                h.getCompany() != null ? h.getCompany().getId() : null,
                h.getCompany() != null ? h.getCompany().getName() : null
        );
    }
}