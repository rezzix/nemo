package com.jari.client;

import com.jari.common.exception.EntityNotFoundException;
import com.jari.company.Company;
import com.jari.company.CompanyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientContactRepository contactRepository;
    private final CompanyRepository companyRepository;

    public ClientService(ClientRepository clientRepository, ClientContactRepository contactRepository,
                         CompanyRepository companyRepository) {
        this.clientRepository = clientRepository;
        this.contactRepository = contactRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<Client> search(String search, Long companyId, int page, int size, String sort) {
        Sort.Direction direction = Sort.Direction.fromString(sort.split(",")[1]);
        PageRequest pageRequest = PageRequest.of(page, size, direction, sort.split(",")[0]);
        return clientRepository.search(search, companyId, pageRequest);
    }

    @Transactional(readOnly = true)
    public Client getById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Client", id));
    }

    @Transactional
    public Client create(ClientDto.CreateRequest request, Long companyId) {
        Client client = new Client();
        client.setName(request.name());
        client.setIndustry(request.industry());
        client.setWebsite(request.website());
        client.setNotes(request.notes());
        if (companyId != null) {
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new EntityNotFoundException("Company", companyId));
            client.setCompany(company);
        }
        client = clientRepository.save(client);

        if (request.contacts() != null) {
            for (ClientDto.ContactCreateRequest contactReq : request.contacts()) {
                ClientContact contact = new ClientContact(client, contactReq.name(), contactReq.email(), contactReq.phone(), contactReq.role());
                contactRepository.save(contact);
            }
        }

        return client;
    }

    @Transactional
    public Client update(Long id, ClientDto.UpdateRequest request) {
        Client client = getById(id);
        if (request.name() != null) client.setName(request.name());
        if (request.industry() != null) client.setIndustry(request.industry());
        if (request.website() != null) client.setWebsite(request.website());
        if (request.notes() != null) client.setNotes(request.notes());
        if (request.companyId() != null) {
            Company company = companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
            client.setCompany(company);
        }
        return clientRepository.save(client);
    }

    @Transactional
    public void delete(Long id) {
        Client client = getById(id);
        contactRepository.deleteByClientId(id);
        clientRepository.delete(client);
    }

    // Contacts
    @Transactional(readOnly = true)
    public List<ClientContact> getContacts(Long clientId) {
        return contactRepository.findByClientIdOrderByCreatedAtAsc(clientId);
    }

    @Transactional
    public ClientContact addContact(Long clientId, ClientDto.ContactCreateRequest request) {
        Client client = getById(clientId);
        return contactRepository.save(new ClientContact(client, request.name(), request.email(), request.phone(), request.role()));
    }

    @Transactional
    public ClientContact updateContact(Long contactId, ClientDto.ContactUpdateRequest request) {
        ClientContact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new EntityNotFoundException("ClientContact", contactId));
        if (request.name() != null) contact.setName(request.name());
        if (request.email() != null) contact.setEmail(request.email());
        if (request.phone() != null) contact.setPhone(request.phone());
        if (request.role() != null) contact.setRole(request.role());
        return contactRepository.save(contact);
    }

    @Transactional
    public void deleteContact(Long contactId) {
        contactRepository.deleteById(contactId);
    }
}