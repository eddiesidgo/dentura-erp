package com.dentura.api.payment;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAllocationRepository extends JpaRepository<PaymentAllocation, Long> {

	List<PaymentAllocation> findByPaymentIdOrderByIdAsc(Long paymentId);

	List<PaymentAllocation> findByPaymentIdIn(Collection<Long> paymentIds);

	boolean existsByWorkId(Long workId);

	void deleteByPaymentId(Long paymentId);
}
