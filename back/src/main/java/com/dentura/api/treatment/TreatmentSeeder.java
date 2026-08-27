package com.dentura.api.treatment;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Catálogo inicial tomado del combo TRATAMIENTO de GestOdon V1.7
 * (capturas en documents/img). Los precios quedan en 0 para que cada clínica
 * los complete.
 */
@Component
public class TreatmentSeeder {

	record SeedItem(String code, String name) {
	}

	static final List<SeedItem> GESTODON = List.of(
			new SeedItem("AO", "Ajuste Oclusal"),
			new SeedItem("BLAQ", "Blanqueamiento de Dientes"),
			new SeedItem("BTCR", "Blanqueamiento de diente con TCR"),
			new SeedItem("CAM", "Cambio de Diente"),
			new SeedItem("CAR", "Carilla de Ceromero"),
			new SeedItem("CARC", "Carilla Libre de Metal E-max"),
			new SeedItem("CARP", "Carilla Porcelana Prensada"),
			new SeedItem("CCE", "Corona Ceromero"),
			new SeedItem("CCIR", "Corona de Circonia"),
			new SeedItem("CJ", "Curetajes"),
			new SeedItem("CMP", "Corona Metal Porcelana"),
			new SeedItem("CONS", "Consulta"),
			new SeedItem("CONT", "Contorneado"),
			new SeedItem("CPP", "Corona Libre de Metal E-Max"),
			new SeedItem("CTR", "Cierre de Troneras con Resina"),
			new SeedItem("EDW", "Edelweiss Carillas Sinterizadas con Láser"),
			new SeedItem("EXO", "Exodoncia Simple"),
			new SeedItem("FERU", "Ferulizado"),
			new SeedItem("FIS", "Fisurotomías"),
			new SeedItem("GIN", "Gingivectomía"),
			new SeedItem("GIQ", "Guía Quirúrgica"),
			new SeedItem("GO", "Guarda Oclusal"),
			new SeedItem("GQ", "Guía Quirúrgica"),
			new SeedItem("IMPL", "Implante Dental"),
			new SeedItem("INC", "Incrustación de Ceromero"),
			new SeedItem("INCC", "Incrustación de Circonia"),
			new SeedItem("INMP", "Incrustación Metal Porcelana"),
			new SeedItem("INPC", "Incrustación Porcelana Computarizada"),
			new SeedItem("INPP", "Incrustación Porcelana Prensada"),
			new SeedItem("LR", "Laminado de Resinas"),
			new SeedItem("MIC", "Microabrasión"),
			new SeedItem("P+RE", "Poste + Reconstrucción"),
			new SeedItem("PARC", "Parciales"),
			new SeedItem("PL", "Periodoncia Leve"),
			new SeedItem("PLR", "Pulido de Laminado"),
			new SeedItem("PM", "Periodoncia Severa"),
			new SeedItem("PPFC", "Puente de Ceromero 3 unidades"),
			new SeedItem("PPR", "Prótesis Parcial Removible"),
			new SeedItem("PPRU", "Prótesis Parcial Removible Unilateral"),
			new SeedItem("PROA", "Provisional de Acrílico"),
			new SeedItem("PROF", "Profilaxis"),
			new SeedItem("PROV", "Provisional de Resina"),
			new SeedItem("PTI", "Prótesis Total Provisional"),
			new SeedItem("PTS", "Prótesis Total Superior"),
			new SeedItem("RBLA", "Retoque de Blanqueamiento"),
			new SeedItem("RECE", "Recementado"),
			new SeedItem("RICC", "Rehabilitación de Implante de Circonia"),
			new SeedItem("RILM", "Rehabilitación de Implante Disilicato de Litio"),
			new SeedItem("RIMP", "Rehabilitación de Implante"),
			new SeedItem("RLR", "Retoque de Laminado Resina"),
			new SeedItem("RR", "Restauración de Resina"),
			new SeedItem("RXE", "Radiografía"),
			new SeedItem("SFF", "Sellado de Fosas y Fisuras"),
			new SeedItem("TRAS", "Tratamiento de Sensibilidad"),
			new SeedItem("UDDL", "Unidad Disilicato de Litio"),
			new SeedItem("UPCI", "Unidad Prótesis Circonia"),
			new SeedItem("UPFC", "Unidad Prótesis Fija Ceromero"),
			new SeedItem("UPMP", "Unidad Prótesis Metal Porcelana"),
			new SeedItem("UPPC", "Unidad Porcelana Computarizada"));

	private final TreatmentRepository treatmentRepository;

	public TreatmentSeeder(TreatmentRepository treatmentRepository) {
		this.treatmentRepository = treatmentRepository;
	}

	@Transactional
	public void ensureClinicCatalog(Long clinicId) {
		if (treatmentRepository.existsByClinicId(clinicId)) {
			return;
		}
		int order = 0;
		for (SeedItem item : GESTODON) {
			Treatment treatment = new Treatment();
			treatment.setClinicId(clinicId);
			treatment.setCode(item.code());
			treatment.setName(item.name());
			treatment.setPrice(BigDecimal.ZERO);
			treatment.setActive(true);
			treatment.setSortOrder(order++);
			treatmentRepository.save(treatment);
		}
	}
}
