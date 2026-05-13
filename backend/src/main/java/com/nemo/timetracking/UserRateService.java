package com.nemo.timetracking;

import com.nemo.common.exception.EntityNotFoundException;
import com.nemo.user.User;
import com.nemo.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class UserRateService {

    private final UserRateRepository userRateRepository;
    private final UserRepository userRepository;

    public UserRateService(UserRateRepository userRateRepository, UserRepository userRepository) {
        this.userRateRepository = userRateRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserRate> getByUserId(Long userId) {
        return userRateRepository.findByUserIdOrderByEffectiveFromDesc(userId);
    }

    @Transactional(readOnly = true)
    public UserRate getById(Long id) {
        return userRateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("UserRate", id));
    }

    @Transactional(readOnly = true)
    public UserRate getEffectiveRate(Long userId, LocalDate date) {
        return userRateRepository.findEffectiveRate(userId, date)
                .orElse(null);
    }

    @Transactional
    public UserRate create(UserRateDto.CreateRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new EntityNotFoundException("User", request.userId()));

        UserRate rate = new UserRate();
        rate.setUser(user);
        rate.setHourlyRate(request.hourlyRate());
        rate.setEffectiveFrom(LocalDate.parse(request.effectiveFrom()));
        return userRateRepository.save(rate);
    }

    @Transactional
    public UserRate update(Long id, UserRateDto.UpdateRequest request) {
        UserRate rate = getById(id);
        if (request.hourlyRate() != null) rate.setHourlyRate(request.hourlyRate());
        if (request.effectiveFrom() != null) rate.setEffectiveFrom(LocalDate.parse(request.effectiveFrom()));
        return userRateRepository.save(rate);
    }

    @Transactional
    public void delete(Long id) {
        UserRate rate = getById(id);
        userRateRepository.delete(rate);
    }
}