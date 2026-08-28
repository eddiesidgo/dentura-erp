package com.dentura.api.report;

import java.io.ByteArrayOutputStream;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

@Service
public class PdfReportService {

	private final TemplateEngine templateEngine;

	public PdfReportService(TemplateEngine templateEngine) {
		this.templateEngine = templateEngine;
	}

	public byte[] render(String templateName, Map<String, Object> variables) {
		Context context = new Context();
		context.setVariables(variables);
		String html = templateEngine.process(templateName, context);
		try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
			PdfRendererBuilder builder = new PdfRendererBuilder();
			builder.useFastMode();
			builder.withHtmlContent(html, null);
			builder.toStream(output);
			builder.run();
			return output.toByteArray();
		} catch (Exception ex) {
			throw new IllegalStateException("No se pudo generar el PDF", ex);
		}
	}
}
