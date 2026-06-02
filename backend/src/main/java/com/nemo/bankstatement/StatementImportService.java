package com.nemo.bankstatement;

import com.nemo.bankaccount.BankAccount;
import com.nemo.bankaccount.BankAccountRepository;
import com.nemo.banktransaction.BankTransaction;
import com.nemo.banktransaction.BankTransactionRepository;
import com.nemo.common.exception.EntityNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class StatementImportService {

    private static final Logger log = LoggerFactory.getLogger(StatementImportService.class);
    private static final BigDecimal MATCH_TOLERANCE = new BigDecimal("0.02");

    private final BankAccountRepository bankAccountRepository;
    private final BankStatementRepository bankStatementRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final RestTemplate restTemplate;

    public StatementImportService(BankAccountRepository bankAccountRepository,
                                   BankStatementRepository bankStatementRepository,
                                   BankTransactionRepository bankTransactionRepository,
                                   ObjectMapper objectMapper,
                                   @Value("${nemo.openai.api-key:}") String apiKey,
                                   @Value("${nemo.openai.base-url:https://ollama.com/v1}") String baseUrl,
                                   @Value("${nemo.openai.model:qwen3.5}") String model) {
        this.bankAccountRepository = bankAccountRepository;
        this.bankStatementRepository = bankStatementRepository;
        this.bankTransactionRepository = bankTransactionRepository;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.model = model;
        RestTemplate template = new RestTemplate();
        template.setRequestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
            setConnectTimeout(java.time.Duration.ofSeconds(10));
            setReadTimeout(java.time.Duration.ofMinutes(5));
        }});
        this.restTemplate = template;
    }

    @Transactional
    public BankStatementDto.ImportResult importPdf(Long bankAccountId, MultipartFile file) {
        BankAccount account = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new EntityNotFoundException("BankAccount", bankAccountId));

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OpenAI API key is not configured. Set nemo.openai.api-key in application.yml or OPENAI_API_KEY environment variable.");
        }

        try {
            // 1. Extract text from PDF using PDFBox
            String pdfText;
            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                pdfText = stripper.getText(document);
            }

            if (pdfText == null || pdfText.isBlank()) {
                throw new RuntimeException("Could not extract any text from the PDF. The file may be a scanned image.");
            }

            // 2. Build OpenAI-compatible request with extracted text
            String systemPrompt = "You are a bank statement parser. Extract all transactions from the bank statement text. " +
                    "Return a JSON object with the exact schema specified. " +
                    "Amounts should be positive for credits (money in) and negative for debits (money out). " +
                    "Be thorough — extract every transaction. " +
                    "The statement period, totals, and balances should match what is shown in the document. " +
                    "IMPORTANT: Return ONLY valid JSON, no markdown fences, no explanation.";

            String userPrompt = "Extract all transactions from this bank statement text. Return JSON with: " +
                    "\"statementPeriod\" (\"startDate\" as YYYY-MM-DD, \"endDate\" as YYYY-MM-DD), " +
                    "\"totalDebits\" (absolute sum of all negative amounts as positive number), " +
                    "\"totalCredits\" (sum of all positive amounts), " +
                    "\"openingBalance\", \"closingBalance\", " +
                    "and \"operations\" array (each with \"date\" as YYYY-MM-DD, \"description\", \"amount\" where positive=credit/negative=debit, \"reference\" or null).\n\n" +
                    "Bank statement text:\n" + pdfText;

            Map<String, Object> request = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    ),
                    "max_tokens", 16384,
                    "response_format", Map.of("type", "json_object")
            );

            // 3. Call OpenAI-compatible API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(request), headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/chat/completions", HttpMethod.POST, entity, String.class);

            // 4. Parse response
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            JsonNode messageNode = responseJson.path("choices").get(0).path("message");
            String content = messageNode.path("content").asText();

            // If content is empty, check for reasoning field (some models like qwen3.5 put the answer there)
            if (content == null || content.isBlank()) {
                String reasoning = messageNode.path("reasoning").asText(null);
                if (reasoning != null && !reasoning.isBlank()) {
                    content = reasoning;
                }
            }

            // Strip <think>...</think> tags if present (some models wrap reasoning in these)
            content = content.replaceAll("(?s)<think>.*?</think>", "").trim();

            // Strip markdown code fences if present
            content = content.trim();
            if (content.startsWith("```json")) {
                content = content.substring(7);
            } else if (content.startsWith("```")) {
                content = content.substring(3);
            }
            if (content.endsWith("```")) {
                content = content.substring(0, content.length() - 3);
            }
            content = content.trim();

            JsonNode extracted = objectMapper.readTree(content);

            // 5. Parse statement metadata
            LocalDate periodStart = parseDate(extracted.path("statementPeriod").path("startDate").asText(null));
            LocalDate periodEnd = parseDate(extracted.path("statementPeriod").path("endDate").asText(null));
            BigDecimal totalDebits = parseBigDecimal(extracted.path("totalDebits"));
            BigDecimal totalCredits = parseBigDecimal(extracted.path("totalCredits"));
            BigDecimal openingBalance = parseBigDecimalOrNull(extracted.path("openingBalance"));
            BigDecimal closingBalance = parseBigDecimalOrNull(extracted.path("closingBalance"));

            // 6. Parse operations and create transactions
            JsonNode operations = extracted.path("operations");
            List<BankTransaction> transactions = new ArrayList<>();
            BigDecimal computedDebits = BigDecimal.ZERO;
            BigDecimal computedCredits = BigDecimal.ZERO;

            for (JsonNode op : operations) {
                BigDecimal amount = parseBigDecimal(op.path("amount"));
                String currency = account.getCurrency();
                String dateStr = op.path("date").asText(null);
                String description = op.path("description").asText("");
                String reference = op.path("reference").asText(null);
                if ("null".equals(reference)) reference = null;

                BankTransaction tx = new BankTransaction();
                tx.setBankAccount(account);
                tx.setDate(dateStr != null ? LocalDate.parse(dateStr) : null);
                tx.setDescription(description);
                tx.setAmount(amount != null ? amount : BigDecimal.ZERO);
                tx.setCurrency(currency);
                tx.setReference(reference);
                transactions.add(tx);

                if (amount != null) {
                    if (amount.compareTo(BigDecimal.ZERO) < 0) {
                        computedDebits = computedDebits.add(amount.abs());
                    } else {
                        computedCredits = computedCredits.add(amount);
                    }
                }
            }

            // 7. Sum check
            boolean matched = isMatch(computedDebits, totalDebits) && isMatch(computedCredits, totalCredits);

            // 8. Save statement
            BankStatement statement = new BankStatement();
            statement.setBankAccount(account);
            statement.setFileName(file.getOriginalFilename());
            statement.setPeriodStart(periodStart);
            statement.setPeriodEnd(periodEnd);
            statement.setTotalDebits(totalDebits);
            statement.setTotalCredits(totalCredits);
            statement.setOpeningBalance(openingBalance);
            statement.setClosingBalance(closingBalance);
            statement.setComputedDebits(computedDebits);
            statement.setComputedCredits(computedCredits);
            statement.setMatched(matched);
            bankStatementRepository.save(statement);

            // 9. Save transactions with link to statement
            for (BankTransaction tx : transactions) {
                tx.setBankStatement(statement);
                bankTransactionRepository.save(tx);
            }

            String warning = null;
            if (!matched) {
                warning = String.format("Sum check mismatch: computed debits=%s vs statement=%s, computed credits=%s vs statement=%s",
                        computedDebits, totalDebits, computedCredits, totalCredits);
            }

            return new BankStatementDto.ImportResult(
                    statement.getId(),
                    transactions.size(),
                    matched,
                    warning
            );

        } catch (EntityNotFoundException e) {
            throw e;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to import bank statement PDF", e);
            throw new RuntimeException("Failed to import bank statement: " + e.getMessage(), e);
        }
    }

    private boolean isMatch(BigDecimal computed, BigDecimal stated) {
        if (computed == null || stated == null) return false;
        return computed.subtract(stated).abs().compareTo(MATCH_TOLERANCE) <= 0;
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal parseBigDecimal(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return BigDecimal.ZERO;
        try {
            return node.decimalValue();
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal parseBigDecimalOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        try {
            return node.decimalValue();
        } catch (Exception e) {
            return null;
        }
    }
}