package com.nemo.pmo;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.util.Map;

/**
 * Deserializes RAID probability/impact values that can be either integers (1-5)
 * or string enums (VERY_LOW, LOW, MEDIUM, HIGH, CRITICAL).
 */
public class RiskScaleDeserializer extends JsonDeserializer<Integer> {

    private static final Map<String, Integer> STRING_TO_INT = Map.of(
            "VERY_LOW", 1,
            "LOW", 2,
            "MEDIUM", 3,
            "HIGH", 4,
            "CRITICAL", 5
    );

    @Override
    public Integer deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        switch (p.currentToken()) {
            case VALUE_NUMBER_INT:
                return p.getIntValue();
            case VALUE_STRING:
                String text = p.getText().trim().toUpperCase();
                if (text.isEmpty()) {
                    return null;
                }
                Integer mapped = STRING_TO_INT.get(text);
                if (mapped != null) {
                    return mapped;
                }
                try {
                    return Integer.parseInt(text);
                } catch (NumberFormatException e) {
                    throw new IOException("Invalid risk scale value: '" + p.getText() +
                            "'. Expected integer (1-5) or string (VERY_LOW, LOW, MEDIUM, HIGH, CRITICAL).");
                }
            case VALUE_NULL:
                return null;
            default:
                throw new IOException("Unexpected token for risk scale value: " + p.currentToken());
        }
    }
}