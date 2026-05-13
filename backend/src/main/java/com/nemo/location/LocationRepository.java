package com.nemo.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByCompanyIdAndActiveTrue(Long companyId);

    List<Location> findByCompanyIdAndParentIsNullAndActiveTrue(Long companyId);

    List<Location> findByParentIdAndActiveTrue(Long parentId);

    List<Location> findByCompanyIdAndActiveTrueOrderByIdAsc(Long companyId);

    List<Location> findByParentIsNullAndActiveTrue();

    List<Location> findByActiveTrueOrderByIdAsc();
}