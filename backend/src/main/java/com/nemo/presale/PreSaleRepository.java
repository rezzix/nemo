package com.nemo.presale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PreSaleRepository extends JpaRepository<PreSale, Long> {
    boolean existsByKey(String key);

    @Query("SELECT p FROM PreSale p WHERE " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.client.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:stage IS NULL OR p.stage = :stage) AND " +
           "(:managerId IS NULL OR p.manager.id = :managerId) AND " +
           "(:companyId IS NULL OR p.company.id = :companyId OR p.company.id IS NULL)")
    Page<PreSale> search(@Param("search") String search, @Param("stage") PreSale.PreSaleStage stage,
                         @Param("managerId") Long managerId, @Param("companyId") Long companyId, Pageable pageable);
}