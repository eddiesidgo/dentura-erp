package com.dentura.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "dentura.storage")
public class StorageProperties {

	private String uploadsDir = "./data/uploads";

	public String getUploadsDir() {
		return uploadsDir;
	}

	public void setUploadsDir(String uploadsDir) {
		this.uploadsDir = uploadsDir;
	}
}
