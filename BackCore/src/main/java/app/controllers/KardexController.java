package app.controllers;

import app.services.KardexService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import app.entities.KardexEntity;
import app.exceptions.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/kardex")
public class KardexController {

    private final KardexService kardexService;

    public KardexController(KardexService kardexService) {
        this.kardexService = kardexService;
    }

    @GetMapping("/tool/{toolId}")
    public ResponseEntity<List<KardexEntity>> getMovementsByToolId(@PathVariable Long toolId) {
        try {
            List<KardexEntity> movements = kardexService.getMovementsByToolId(toolId);
            return ResponseEntity.ok(movements);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/date")
    public List<KardexEntity> getMovementsByDate(@RequestParam String start,@RequestParam String end) {
        LocalDateTime startTime = LocalDateTime.parse(start);
        LocalDateTime endTime = LocalDateTime.parse(end);
        return kardexService.getMovementsByDate(startTime, endTime);
    }
}