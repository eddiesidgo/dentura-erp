package com.dentura.api.reminder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReminderScheduler {

	private static final Logger log = LoggerFactory.getLogger(ReminderScheduler.class);

	private final ReminderService reminderService;

	public ReminderScheduler(ReminderService reminderService) {
		this.reminderService = reminderService;
	}

	@Scheduled(cron = "0 0 * * * *")
	public void generateHourly() {
		var result = reminderService.generateForAllClinics();
		if (result.created() > 0 || result.skipped() > 0) {
			log.info("Recordatorios generados: created={}, skipped={}", result.created(), result.skipped());
		}
	}
}
