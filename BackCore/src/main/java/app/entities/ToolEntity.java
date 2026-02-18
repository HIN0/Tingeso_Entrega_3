package app.entities;

import app.entities.enums.ToolStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "tools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name cannot be blank") 
    private String name;

    @NotBlank(message = "Category cannot be blank")
    private String category;

    @Enumerated(EnumType.STRING)
    private ToolStatus status; 

    @NotNull(message = "Stock cannot be null") 
    @Min(value = 0, message = "Stock cannot be negative") 
    private Integer stock;

    @NotNull(message = "In repair value cannot be null") 
    @Min(value = 0, message = "In repair value cannot be negative")
    @Column(name = "in_repair")
    private Integer inRepair;

    @NotNull(message = "Replacement value cannot be null") 
    @Min(value = 1000, message = "Replacement value cannot be negative")
    @Column(name = "replacement_value")
    private Integer replacementValue;
}