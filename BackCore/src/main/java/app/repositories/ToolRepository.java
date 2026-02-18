package app.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import app.entities.ToolEntity;
import app.entities.enums.ToolStatus;

import java.util.List;

@Repository
public interface ToolRepository extends JpaRepository<ToolEntity, Long> {
    List<ToolEntity> findByStatus(ToolStatus status);
    List<ToolEntity> findByNameContainingIgnoreCase(String name);
}
