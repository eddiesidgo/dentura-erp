package com.dentura.api.medication;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Catálogo inicial de medicamentos frecuentes en odontología general (SV / LATAM).
 * Cada clínica puede editar dosis e instrucciones.
 */
@Component
public class MedicationSeeder {

	record SeedItem(
			String code,
			String name,
			String form,
			String dose,
			String frequency,
			String duration,
			String instructions) {
	}

	static final List<SeedItem> DENTAL = List.of(
			new SeedItem("AMOX500", "Amoxicilina 500 mg", "Cápsula", "1 cápsula", "cada 8 horas", "7 días",
					"Tomar con alimentos. Completar el tratamiento."),
			new SeedItem("AMOXCLAV", "Amoxicilina / Ácido clavulánico 875/125 mg", "Tableta", "1 tableta", "cada 12 horas",
					"7 días", "Tomar con alimentos."),
			new SeedItem("CLINDA300", "Clindamicina 300 mg", "Cápsula", "1 cápsula", "cada 8 horas", "7 días",
					"Alternativa en alergia a penicilina."),
			new SeedItem("AZITRO500", "Azitromicina 500 mg", "Tableta", "1 tableta", "cada 24 horas", "3 días",
					"Tomar 1 hora antes o 2 horas después de alimentos."),
			new SeedItem("METRO500", "Metronidazol 500 mg", "Tableta", "1 tableta", "cada 8 horas", "7 días",
					"Evitar alcohol durante el tratamiento."),
			new SeedItem("IBU400", "Ibuprofeno 400 mg", "Tableta", "1 tableta", "cada 8 horas", "3 a 5 días",
					"Tomar con alimentos. No exceder dosis máxima diaria."),
			new SeedItem("IBU600", "Ibuprofeno 600 mg", "Tableta", "1 tableta", "cada 8 horas", "3 a 5 días",
					"Tomar con alimentos."),
			new SeedItem("PARA500", "Paracetamol 500 mg", "Tableta", "1 a 2 tabletas", "cada 6 a 8 horas", "3 a 5 días",
					"No exceder 4 g/día en adultos."),
			new SeedItem("KETO10", "Ketorolaco 10 mg", "Tableta", "1 tableta", "cada 8 horas", "máx. 5 días",
					"Solo por indicación. Tomar con alimentos."),
			new SeedItem("DEXA4", "Dexametasona 4 mg", "Tableta", "1 tableta", "cada 8 a 12 horas", "según indicación",
					"No suspender de forma abrupta si el curso es prolongado."),
			new SeedItem("PRED50", "Prednisona 50 mg", "Tableta", "1 tableta", "cada 24 horas", "según indicación",
					"Tomar en la mañana con alimentos."),
			new SeedItem("NAPROX550", "Naproxeno 550 mg", "Tableta", "1 tableta", "cada 12 horas", "3 a 5 días",
					"Tomar con alimentos."),
			new SeedItem("CLORHEX", "Enjuague de clorhexidina 0.12%", "Solución", "15 ml", "2 veces al día", "7 a 14 días",
					"Enjuagar 30–60 segundos. No enjuagar con agua después."),
			new SeedItem("BENZOC", "Gel anestésico tópico (benzocaína)", "Gel", "aplicar capa fina", "según necesidad",
					"uso local", "Solo en zona indicada. No tragar."),
			new SeedItem("OMEP20", "Omeprazol 20 mg", "Cápsula", "1 cápsula", "cada 24 horas", "mientras use AINE",
					"Tomar en ayunas si se indica gastroprotección."));

	private final MedicationRepository medicationRepository;

	public MedicationSeeder(MedicationRepository medicationRepository) {
		this.medicationRepository = medicationRepository;
	}

	@Transactional
	public void ensureClinicCatalog(Long clinicId) {
		if (medicationRepository.existsByClinicId(clinicId)) {
			return;
		}
		int order = 0;
		for (SeedItem item : DENTAL) {
			Medication medication = new Medication();
			medication.setClinicId(clinicId);
			medication.setCode(item.code());
			medication.setName(item.name());
			medication.setForm(item.form());
			medication.setDose(item.dose());
			medication.setFrequency(item.frequency());
			medication.setDuration(item.duration());
			medication.setInstructions(item.instructions());
			medication.setActive(true);
			medication.setSortOrder(order++);
			medicationRepository.save(medication);
		}
	}
}
