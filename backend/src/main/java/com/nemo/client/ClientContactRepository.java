package com.nemo.client;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClientContactRepository extends JpaRepository<ClientContact, Long> {
    List<ClientContact> findByClientIdOrderByCreatedAtAsc(Long clientId);
    void deleteByClientId(Long clientId);
}