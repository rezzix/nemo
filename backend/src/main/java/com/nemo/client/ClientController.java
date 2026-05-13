package com.nemo.client;

import com.nemo.common.dto.ApiResponse;
import com.nemo.common.dto.PaginatedResponse;
import com.nemo.common.dto.PaginatedResponse.PaginationInfo;
import com.nemo.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;
    private final ClientMapper clientMapper;
    private final AuthHelper authHelper;

    public ClientController(ClientService clientService, ClientMapper clientMapper, AuthHelper authHelper) {
        this.clientService = clientService;
        this.clientMapper = clientMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ClientDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name,asc") String sort,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = null;
        if (!authHelper.hasAnyRole(currentUser, "ADMIN")) {
            companyId = authHelper.getCurrentCompanyId(currentUser);
        }
        Page<Client> result = clientService.search(search, companyId, page, size, sort);
        List<ClientDto> dtos = enrichWithContacts(result.getContent());
        return ResponseEntity.ok(PaginatedResponse.of(dtos,
                new PaginationInfo(page, size, result.getTotalElements(), result.getTotalPages())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientDto>> get(@PathVariable Long id) {
        Client client = clientService.getById(id);
        ClientDto dto = enrichDto(client);
        return ResponseEntity.ok(ApiResponse.of(dto));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<ClientDto>> create(
            @Valid @RequestBody ClientDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = request.companyId();
        Client created = clientService.create(request, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(enrichDto(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<ClientDto>> update(
            @PathVariable Long id, @RequestBody ClientDto.UpdateRequest request) {
        Client updated = clientService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(enrichDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Contacts
    @GetMapping("/{id}/contacts")
    public ResponseEntity<ApiResponse<List<ClientDto.ContactDto>>> getContacts(@PathVariable Long id) {
        List<ClientContact> contacts = clientService.getContacts(id);
        List<ClientDto.ContactDto> dtos = contacts.stream()
                .map(c -> new ClientDto.ContactDto(c.getId(), c.getName(), c.getEmail(), c.getPhone(), c.getRole()))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(dtos));
    }

    @PostMapping("/{id}/contacts")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<ClientDto.ContactDto>> addContact(
            @PathVariable Long id, @Valid @RequestBody ClientDto.ContactCreateRequest request) {
        ClientContact contact = clientService.addContact(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(
                new ClientDto.ContactDto(contact.getId(), contact.getName(), contact.getEmail(), contact.getPhone(), contact.getRole())));
    }

    @PutMapping("/{id}/contacts/{contactId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<ApiResponse<ClientDto.ContactDto>> updateContact(
            @PathVariable Long id, @PathVariable Long contactId,
            @RequestBody ClientDto.ContactUpdateRequest request) {
        ClientContact contact = clientService.updateContact(contactId, request);
        return ResponseEntity.ok(ApiResponse.of(
                new ClientDto.ContactDto(contact.getId(), contact.getName(), contact.getEmail(), contact.getPhone(), contact.getRole())));
    }

    @DeleteMapping("/{id}/contacts/{contactId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EXECUTIVE')")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id, @PathVariable Long contactId) {
        clientService.deleteContact(contactId);
        return ResponseEntity.noContent().build();
    }

    private ClientDto enrichDto(Client client) {
        ClientDto base = clientMapper.toDto(client);
        List<ClientDto.ContactDto> contacts = clientService.getContacts(client.getId()).stream()
                .map(c -> new ClientDto.ContactDto(c.getId(), c.getName(), c.getEmail(), c.getPhone(), c.getRole()))
                .toList();
        return new ClientDto(base.id(), base.name(), base.industry(), base.website(), base.notes(),
                base.companyId(), base.companyName(), contacts, base.createdAt(), base.updatedAt());
    }

    private List<ClientDto> enrichWithContacts(List<Client> clients) {
        return clients.stream().map(this::enrichDto).toList();
    }
}