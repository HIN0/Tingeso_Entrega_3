package entities;

import entities.enums.ClientStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String rut;

    private String phone;

    private String email;

    @Enumerated(EnumType.STRING)
    private ClientStatus status;
}
    