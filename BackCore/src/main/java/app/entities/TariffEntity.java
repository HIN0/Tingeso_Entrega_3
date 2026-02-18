package app.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tariffs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "daily_rent_fee")
    private Integer dailyRentFee;    // Tarifa diaria de arriendo

    @Column(name = "daily_late_fee")
    private Integer dailyLateFee;    // Tarifa diaria de multa

    @Column(name = "repair_fee")
    private Integer repairFee;      // Cargo por reparación leve
}
