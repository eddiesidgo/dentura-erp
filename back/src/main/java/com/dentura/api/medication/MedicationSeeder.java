package com.dentura.api.medication;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Catálogo inicial orientado a odontología general y estética en El Salvador / LATAM.
 * Referencias: guía odontológica MINSAL (profilaxis), LOM/MINSAL (clorhexidina y esenciales),
 * práctica clínica UES, protocolos AINE/antibiótico dentales y manejo de sensibilidad post-blanqueamiento.
 * Las dosis son sugerencias editables por clínica; no sustituyen criterio clínico ni normativa DNM/CSSP.
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
			// --- Antibióticos (infección / profilaxis selectiva) ---
			new SeedItem("AMOX500", "Amoxicilina 500 mg", "Cápsula", "1 cápsula", "cada 8 horas", "5 a 7 días",
					"Primera línea en infecciones odontogénicas. Tomar con alimentos. Completar el esquema."),
			new SeedItem("AMOX2G", "Amoxicilina 500 mg (profilaxis 2 g)", "Cápsula", "4 cápsulas (2 g)", "dosis única",
					"30–60 min antes",
					"Profilaxis de endocarditis en pacientes de alto riesgo (según guía). No usar de rutina en estética."),
			new SeedItem("AMOXCLAV", "Amoxicilina / Ácido clavulánico 875/125 mg", "Tableta", "1 tableta", "cada 12 horas",
					"5 a 7 días", "Infecciones que no responden a amoxicilina sola. Tomar con alimentos."),
			new SeedItem("AMOXCLAV500", "Amoxicilina / Ácido clavulánico 500/125 mg", "Tableta", "1 tableta", "cada 8 horas",
					"5 a 7 días", "Alternativa de dosificación. Tomar con alimentos."),
			new SeedItem("CEFALEX500", "Cefalexina 500 mg", "Cápsula", "1 cápsula", "cada 6 a 8 horas", "5 a 7 días",
					"Infecciones dentales / tejido blando. Alternativa oral (LOM/MINSAL)."),
			new SeedItem("CEFALEX2G", "Cefalexina 500 mg (profilaxis 2 g)", "Cápsula", "4 cápsulas (2 g)", "dosis única",
					"30–60 min antes", "Profilaxis en alérgicos a penicilina sin reacción inmediata tipo anafilaxia."),
			new SeedItem("CLINDA300", "Clindamicina 300 mg", "Cápsula", "1 cápsula", "cada 8 horas", "5 a 7 días",
					"Alternativa en alergia a penicilina. Advertir riesgo GI; suspender si diarrea intensa."),
			new SeedItem("CLINDA600", "Clindamicina 300 mg (profilaxis 600 mg)", "Cápsula", "2 cápsulas (600 mg)", "dosis única",
					"1 hora antes", "Profilaxis histórica en alergia a penicilina (revisar guía vigente de la clínica)."),
			new SeedItem("AZITRO500", "Azitromicina 500 mg", "Tableta", "1 tableta", "cada 24 horas", "3 días",
					"Alternativa en alergia a penicilina. 1 h antes o 2 h después de alimentos."),
			new SeedItem("CLARITRO500", "Claritromicina 500 mg", "Tableta", "1 tableta", "dosis única", "30–60 min antes",
					"Alternativa de profilaxis oral en alergia a penicilina."),
			new SeedItem("DOXY100", "Doxiciclina 100 mg", "Cápsula", "1 cápsula", "cada 24 horas", "según indicación",
					"Alternativa de profilaxis / casos seleccionados. No en embarazo ni menores de 8 años."),
			new SeedItem("METRO500", "Metronidazol 500 mg", "Tableta", "1 tableta", "cada 8 horas", "5 a 7 días",
					"Anaerobios / periodontal (a menudo con amoxicilina). Evitar alcohol."),
			new SeedItem("PENIVK500", "Penicilina V potásica 500 mg", "Tableta", "1 tableta", "cada 6 horas", "5 a 7 días",
					"Alternativa clásica en infecciones odontogénicas."),

			// --- Analgésicos / AINE (post-op, carillas, implantes, exodoncia) ---
			new SeedItem("IBU400", "Ibuprofeno 400 mg", "Tableta", "1 tableta", "cada 6 a 8 horas", "2 a 5 días",
					"Analgesia de primera línea post-procedimiento. Tomar con alimentos."),
			new SeedItem("IBU600", "Ibuprofeno 600 mg", "Tableta", "1 tableta", "cada 8 horas", "2 a 5 días",
					"Dolor moderado–intenso. Tomar con alimentos. No exceder dosis máxima diaria."),
			new SeedItem("PARA500", "Paracetamol (acetaminofén) 500 mg", "Tableta", "1 a 2 tabletas", "cada 6 a 8 horas",
					"2 a 5 días", "Solo o alternado con ibuprofeno. No exceder 4 g/día en adultos."),
			new SeedItem("PARA1G", "Paracetamol (acetaminofén) 1 g", "Tableta", "1 tableta", "cada 8 horas", "2 a 3 días",
					"Dolor agudo post-operatorio. No combinar con otras presentaciones de paracetamol."),
			new SeedItem("NAPROX550", "Naproxeno 550 mg", "Tableta", "1 tableta", "cada 12 horas", "3 a 5 días",
					"AINE de mayor duración. Tomar con alimentos."),
			new SeedItem("DICLOK50", "Diclofenaco potásico 50 mg", "Tableta", "1 tableta", "cada 8 horas", "3 a 5 días",
					"Dolor inflamatorio post-quirúrgico / estética quirúrgica. Con alimentos + gastroprotección si procede."),
			new SeedItem("DICLOS75", "Diclofenaco sódico 75 mg", "Tableta de liberación", "1 tableta", "cada 12 horas",
					"3 a 5 días", "Tomar con alimentos. Evaluar riesgo GI/renal."),
			new SeedItem("KETO10", "Ketorolaco 10 mg", "Tableta", "1 tableta", "cada 8 horas", "máx. 5 días",
					"Dolor intenso de corta duración. No prolongar. Con alimentos."),
			new SeedItem("KETOPRO100", "Ketoprofeno 100 mg", "Cápsula", "1 cápsula", "cada 12 horas", "3 a 5 días",
					"AINE post-operatorio. Tomar con alimentos."),
			new SeedItem("TRAM50", "Tramadol 50 mg", "Cápsula", "1 cápsula", "cada 6 a 8 horas", "máx. 3 días",
					"Dolor intenso cuando AINE no bastan. Posible medicamento controlado (DNM). Evitar conducir."),

			// --- Corticoides (edema post-implante / cirugía oral) ---
			new SeedItem("DEXA4", "Dexametasona 4 mg", "Tableta", "1 tableta", "cada 8 a 12 horas", "según protocolo",
					"Control de edema inflamatorio. No suspender bruscamente si el curso es largo."),
			new SeedItem("PRED50", "Prednisona 50 mg", "Tableta", "1 tableta", "cada 24 horas (mañana)", "según indicación",
					"Tomar con alimentos. Esquema corto habitual en post-quirúrgico."),
			new SeedItem("METHYL16", "Metilprednisolona 16 mg", "Tableta", "1 tableta", "según esquema", "según indicación",
					"Antiinflamatorio esteroideo perioperatorio. Ajustar por peso/protocolo."),

			// --- Ansiolíticos / premedicación (estética + ansiedad) ---
			new SeedItem("DIAZ5", "Diazepam 5 mg", "Tableta", "1 tableta", "dosis única", "30–60 min antes",
					"Premedicación ansiolítica. Controlado. No conducir. Evitar alcohol."),
			new SeedItem("LORA1", "Lorazepam 1 mg", "Tableta", "1 tableta", "dosis única", "30–60 min antes",
					"Premedicación. Controlado. No en menores sin evaluación. No conducir."),
			new SeedItem("ALPRA05", "Alprazolam 0.5 mg", "Tableta", "1 tableta", "dosis única", "30–60 min antes",
					"Ansiedad preoperatoria. Controlado. Uso puntual bajo supervisión."),
			new SeedItem("MIDAZ15", "Midazolam 15 mg", "Tableta", "según protocolo", "dosis única", "antes del procedimiento",
					"Sedación consciente / premedicación avanzada. Solo con protocolo y monitoreo."),

			// --- Relajante muscular (bruxismo / dolor miofacial, frecuente en estética) ---
			new SeedItem("METOCARB", "Metocarbamol 500 mg", "Tableta", "1 a 2 tabletas", "cada 6 a 8 horas", "3 a 5 días",
					"Espasmo muscular / bruxismo. Puede causar somnolencia."),

			// --- Antifúngicos / antivirales (prótesis provisionales, herpes labial) ---
			new SeedItem("NIST_SUSP", "Nistatina 100,000 UI/mL", "Suspensión oral", "4 a 6 mL", "4 veces al día", "7 a 14 días",
					"Candidiasis oral. Retener en boca antes de tragar o escupir según indicación (LOM)."),
			new SeedItem("MICON_GEL", "Miconazol gel oral 2%", "Gel", "aplicar capa fina", "3 a 4 veces al día", "7 a 14 días",
					"Candidiasis / prótesis. No tragar grandes cantidades."),
			new SeedItem("FLUCO150", "Fluconazol 150 mg", "Cápsula", "1 cápsula", "dosis única o según esquema", "según indicación",
					"Candidiasis refractaria. Revisar interacciones."),
			new SeedItem("ACICLO200", "Aciclovir 200 mg", "Tableta", "1 tableta", "5 veces al día", "5 días",
					"Herpes labial (inicio precoz). Útil antes de procedimientos estéticos faciales/orales."),
			new SeedItem("ACICLOCREMA", "Aciclovir crema 5%", "Crema", "aplicar capa fina", "5 veces al día", "5 días",
					"Herpes labial localizado. Lavar manos antes y después."),

			// --- Antisépticos / topicos / estética (blanqueamiento, sensibilidad, higiene) ---
			new SeedItem("CLORHEX", "Clorhexidina 0.12% (enjuague)", "Solución", "15 ml", "2 veces al día", "7 a 14 días",
					"Uso exclusivo frecuente en odontología (LOM). Enjuagar 30–60 s. Puede manchar; no enjuagar con agua después."),
			new SeedItem("CLORHEX02", "Clorhexidina 0.2% (enjuague)", "Solución", "10 ml", "2 veces al día", "7 días",
					"Post-cirugía / implantes / periodoncia. Uso acotado para reducir tinción."),
			new SeedItem("BENZOC", "Benzocaína tópica gel", "Gel", "capa fina", "según necesidad", "uso local",
					"Anestesia tópica previa a infiltración. No tragar."),
			new SeedItem("LIDOVISC", "Lidocaína viscosa 2%", "Solución / gel", "5 a 10 ml o capa fina", "según necesidad",
					"uso local", "Dolor mucoso / aftas. No exceder dosis; riesgo de toxicidad si se traga en exceso."),
			new SeedItem("TRIAM_ORA", "Triamcinolona acetónido pasta oral", "Pasta", "capa fina", "2 a 4 veces al día",
					"hasta mejoría", "Úlceras aftosas / lesiones inflamatorias. Aplicar sobre lesión seca."),
			new SeedItem("KNO3_GEL", "Nitrato de potasio 5% + flúor (gel desensibilizante)", "Gel", "aplicar en férula o cepillo",
					"1 a 2 veces al día", "durante blanqueamiento",
					"Sensibilidad por blanqueamiento / post-carillas. Retener según protocolo de la clínica."),
			new SeedItem("FLUOR_GEL", "Gel de flúor neutro (profesional / casero)", "Gel", "según cubeta", "según protocolo",
					"según indicación", "Remineralización y sensibilidad. Escupir; no tragar."),
			new SeedItem("FLUOR_BAR", "Barniz de flúor (aplicación clínica)", "Barniz", "aplicación profesional", "sesión única",
					"según plan", "Registro de indicación en consultorio; no es automedicación del paciente."),
			new SeedItem("DESENS_PASTA", "Pasta desensibilizante (uso diario)", "Pasta dental", "cepillado habitual", "2 veces al día",
					"2 a 4 semanas", "Sensibilidad dentinaria / post-blanqueamiento. Complemento al tratamiento en clínica."),

			// --- Hemostasia / soporte ---
			new SeedItem("TRANEX500", "Ácido tranexámico 500 mg", "Tableta", "1 tableta", "cada 8 horas", "2 a 3 días",
					"Apoyo hemostático en pacientes seleccionados / post-cirugía. Evaluar contraindicaciones trombóticas."),
			new SeedItem("OMEP20", "Omeprazol 20 mg", "Cápsula", "1 cápsula", "cada 24 horas (ayunas)", "mientras use AINE",
					"Gastroprotección cuando se indican AINE o corticoides."),
			new SeedItem("RANI150", "Ranitidina 150 mg", "Tableta", "1 tableta", "cada 12 horas", "mientras use AINE",
					"Alternativa de protección gástrica si está disponible en el cuadro local."),
			new SeedItem("LORA10", "Loratadina 10 mg", "Tableta", "1 tableta", "cada 24 horas", "3 a 5 días",
					"Reacciones alérgicas leves (materiales, edema leve). No sustituye manejo de emergencia."),
			new SeedItem("VITC500", "Ácido ascórbico (vitamina C) 500 mg", "Tableta", "1 tableta", "cada 24 horas",
					"7 a 14 días", "Soporte cicatrizal / apoyo nutricional post-quirúrgico (uso habitual en clínica)."),
			new SeedItem("COMPLEJB", "Complejo B", "Tableta", "1 tableta", "cada 24 horas", "7 a 14 días",
					"Apoyo en neuralgias / recuperación; uso adyuvante según criterio."));

	private final MedicationRepository medicationRepository;

	public MedicationSeeder(MedicationRepository medicationRepository) {
		this.medicationRepository = medicationRepository;
	}

	/**
	 * Inserta solo códigos faltantes por clínica (idempotente). No sobrescribe ediciones locales.
	 */
	@Transactional
	public void ensureClinicCatalog(Long clinicId) {
		int order = (int) medicationRepository.countByClinicId(clinicId);
		for (SeedItem item : DENTAL) {
			if (medicationRepository.existsByClinicIdAndCodeIgnoreCase(clinicId, item.code())) {
				continue;
			}
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
