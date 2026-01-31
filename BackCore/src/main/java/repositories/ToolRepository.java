package repositories;

import entities.ToolEntity;
import entities.enums.ToolStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ToolRepository extends JpaRepository<ToolEntity, Long> {
    List<ToolEntity> findByStatus(ToolStatus status);
    List<ToolEntity> findByNameContainingIgnoreCase(String name);
}
