package com.test.ordernotification.infrastructure.controller;

import com.test.ordernotification.api.dto.ClientLogDto;
import com.test.ordernotification.api.facade.ClientLogFacade;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/client-logs")
public class ClientLogController {

    private final ClientLogFacade clientLogFacade;

    public ClientLogController(ClientLogFacade clientLogFacade) {
        this.clientLogFacade = clientLogFacade;
    }

    /**
     * Receives frontend telemetry and logs it on the server.
     * POST /client-logs
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> receiveClientLog(@RequestBody ClientLogDto clientLog) {
        clientLogFacade.processClientLog(clientLog);
        return ResponseEntity.ok(Map.of("status", "logged"));
    }
}
