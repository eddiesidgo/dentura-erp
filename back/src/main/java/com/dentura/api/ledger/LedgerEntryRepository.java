package com.dentura.api.ledger;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

	List<LedgerEntry> findByClinicIdAndPatientIdOrderByEntryDateAscIdAsc(Long clinicId, Long patientId);

	boolean existsByWorkIdAndType(Long workId, String type);

	Optional<LedgerEntry> findByPaymentIdAndType(Long paymentId, String type);

	@Query("""
			select e.patientId,
			       coalesce(sum(case when e.type = 'CHARGE' then e.amount else 0 end), 0),
			       coalesce(sum(case when e.type = 'PAYMENT' then e.amount else 0 end), 0),
			       coalesce(sum(case when e.type = 'ADJUSTMENT' then e.amount else 0 end), 0)
			  from LedgerEntry e
			 where e.clinicId = :clinicId
			 group by e.patientId
			""")
	List<Object[]> aggregateByPatient(@Param("clinicId") Long clinicId);
}
