package com.goiflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class GoiFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(GoiFlowApplication.class, args);
    }
}