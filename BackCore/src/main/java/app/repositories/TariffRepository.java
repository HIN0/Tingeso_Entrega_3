package app.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import app.entities.TariffEntity;

@Repository
public interface TariffRepository extends JpaRepository<TariffEntity, Long> {
}
