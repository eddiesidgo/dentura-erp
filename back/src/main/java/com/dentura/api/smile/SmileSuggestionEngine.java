package com.dentura.api.smile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.dentura.api.smile.dto.SmileSuggestRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Rule-based smile suggestions from classic dental proportions and style templates.
 */
@Component
public class SmileSuggestionEngine {

	private static final int[] UPPER_ANTERIORS = {11, 12, 13, 21, 22, 23};

	private final ObjectMapper objectMapper;

	public SmileSuggestionEngine(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public String suggest(SmileSuggestRequest request) {
		String style = request.style().trim().toUpperCase(Locale.ROOT);
		double archWidth = request.archWidth() == null ? 52.0 : request.archWidth();
		double toothLength = request.toothLength() == null ? 10.5 : request.toothLength();
		double midline = request.midlineOffset() == null ? 0.0 : request.midlineOffset();

		StyleFactors factors = factorsFor(style);
		List<Map<String, Object>> teeth = new ArrayList<>();
		for (int tooth : UPPER_ANTERIORS) {
			teeth.add(toothTransform(tooth, archWidth, toothLength, midline, factors));
		}

		Map<String, Object> design = new LinkedHashMap<>();
		design.put("style", style);
		design.put("archWidth", archWidth);
		design.put("toothLength", toothLength);
		design.put("midlineOffset", midline);
		design.put("gingivalHeight", factors.gingivalHeight());
		design.put("incisalCurve", factors.incisalCurve());
		design.put("suggestedBy", "rules-v1");
		design.put("teeth", teeth);

		try {
			return objectMapper.writeValueAsString(design);
		} catch (JsonProcessingException ex) {
			throw new IllegalStateException("No se pudo serializar la sugerencia", ex);
		}
	}

	private Map<String, Object> toothTransform(
			int tooth,
			double archWidth,
			double toothLength,
			double midline,
			StyleFactors factors) {
		double slot = slotFor(tooth);
		double x = (slot * (archWidth / 10.0)) + midline;
		double widthScale = widthScaleFor(tooth) * factors.widthMul();
		double heightScale = factors.heightMul();
		double tip = tipFor(tooth) * factors.tipMul();

		Map<String, Object> transform = new LinkedHashMap<>();
		transform.put("tooth", String.valueOf(tooth));
		transform.put("position", List.of(x, 0.0, factors.zBase()));
		transform.put("rotation", List.of(tip, 0.0, 0.0));
		transform.put("scale", List.of(widthScale, heightScale * (toothLength / 10.5), 1.0));
		transform.put("shape", factors.shape());
		return transform;
	}

	private static double slotFor(int tooth) {
		return switch (tooth) {
			case 13 -> -2.5;
			case 12 -> -1.5;
			case 11 -> -0.5;
			case 21 -> 0.5;
			case 22 -> 1.5;
			case 23 -> 2.5;
			default -> 0.0;
		};
	}

	private static double widthScaleFor(int tooth) {
		return switch (tooth) {
			case 11, 21 -> 1.0;
			case 12, 22 -> 0.78;
			case 13, 23 -> 0.88;
			default -> 0.9;
		};
	}

	private static double tipFor(int tooth) {
		return switch (tooth) {
			case 13 -> 0.08;
			case 12 -> 0.04;
			case 11, 21 -> 0.0;
			case 22 -> -0.04;
			case 23 -> -0.08;
			default -> 0.0;
		};
	}

	private static StyleFactors factorsFor(String style) {
		return switch (style) {
			case "SQUARE" -> new StyleFactors("SQUARE", 1.05, 0.95, 1.1, 0.6, 0.02, -1.2);
			case "TRIANGULAR" -> new StyleFactors("TRIANGULAR", 0.9, 1.08, 0.85, 1.2, 0.05, -1.0);
			case "HOLLYWOOD" -> new StyleFactors("HOLLYWOOD", 1.02, 1.12, 0.7, 1.4, 0.0, -0.8);
			default -> new StyleFactors("OVAL", 1.0, 1.0, 1.0, 1.0, 0.03, -1.1);
		};
	}

	private record StyleFactors(
			String shape,
			double widthMul,
			double heightMul,
			double tipMul,
			double incisalCurve,
			double gingivalHeight,
			double zBase) {
	}
}
