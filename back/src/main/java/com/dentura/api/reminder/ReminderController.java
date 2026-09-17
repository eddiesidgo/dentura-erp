package com.dentura.api.reminder;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dentura.api.reminder.dto.GenerateRemindersResponse;
import com.dentura.api.reminder.dto.ReminderResponse;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

	private final ReminderService reminderService;

	public ReminderController(ReminderService reminderService) {
		this.reminderService = reminderService;
	}

	@GetMapping
	public List<ReminderResponse> list(@RequestParam(required = false) String status) {
		return reminderService.list(status);
	}

	@PostMapping("/generate")
	public GenerateRemindersResponse generate() {
		return reminderService.generateForCurrentClinic();
	}

	@PostMapping("/{id}/sent")
	public ReminderResponse markSent(@PathVariable Long id) {
		return reminderService.markSent(id);
	}

	@PostMapping("/{id}/skipped")
	public ReminderResponse markSkipped(@PathVariable Long id) {
		return reminderService.markSkipped(id);
	}
}
