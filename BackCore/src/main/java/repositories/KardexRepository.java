package repositories;

import entities.KardexEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface KardexRepository extends JpaRepository<KardexEntity, Long> {

    List<KardexEntity> findByTool_Id(Long toolId);
    List<KardexEntity> findByMovementDateBetween(LocalDateTime start, LocalDateTime end);
    List<KardexEntity> findByTool_IdAndType(Long toolId, entities.enums.MovementType type);
    List<KardexEntity> findByMovementDateBetweenAndType(LocalDateTime start, LocalDateTime end, entities.enums.MovementType type);
}
