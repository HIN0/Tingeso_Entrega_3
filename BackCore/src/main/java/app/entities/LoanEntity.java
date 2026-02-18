package app.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

import app.entities.enums.LoanStatus;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @ManyToOne
    @JoinColumn(name = "tool_id", nullable = false)
    private ToolEntity tool;

    private LocalDate startDate;
    private LocalDate dueDate;
    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    private LoanStatus status;

    @Column(name = "total_penalty")
    private double totalPenalty;
}
