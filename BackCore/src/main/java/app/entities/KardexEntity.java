package app.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import app.entities.enums.MovementType;

@Entity
@Table(name = "kardex")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KardexEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tool_id", nullable = false)
    private ToolEntity tool;

    @Enumerated(EnumType.STRING)
    private MovementType type;

    @Column(name = "movement_date")
    private LocalDateTime movementDate;

    private Integer quantity;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
}
