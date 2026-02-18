package app.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import app.entities.ClientEntity;
import app.entities.enums.ClientStatus;

import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, Long> {
    List<ClientEntity> findByStatus(ClientStatus status);
    boolean existsByRut(String rut);
}
