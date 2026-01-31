package repositories;

import entities.ClientEntity;
import entities.enums.ClientStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, Long> {
    List<ClientEntity> findByStatus(ClientStatus status);
    boolean existsByRut(String rut);
}
