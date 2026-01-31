package repositories;

import entities.ClientEntity;
import entities.LoanEntity;
import entities.ToolEntity;
import entities.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<LoanEntity, Long> {
       List<LoanEntity> findByClient(ClientEntity client);
       List<LoanEntity> findByTool(ToolEntity tool);
       List<LoanEntity> findByStatus(LoanStatus status);
       List<LoanEntity> findByClientAndStatus(ClientEntity client, LoanStatus status);
       List<LoanEntity> findByClientAndStatusAndTotalPenaltyGreaterThan(ClientEntity client, LoanStatus status, double penaltyThreshold);
       long countByClientAndStatus(ClientEntity client, LoanStatus status);

@Query("SELECT l.tool, COUNT(l) as total " +
       "FROM LoanEntity l " +
       "WHERE l.startDate >= :from AND l.startDate <= :to " +
       "GROUP BY l.tool " +
       "ORDER BY total DESC")
       List<Object[]> findTopToolsByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

// RF6.1: Préstamos por estado DENTRO de un rango de fechas (considerando fecha de inicio)
@Query("SELECT l FROM LoanEntity l WHERE l.status = :status AND l.startDate BETWEEN :from AND :to")
       List<LoanEntity> findByStatusAndStartDateBetween(@Param("status") LoanStatus status, @Param("from") LocalDate from, @Param("to") LocalDate to);

// RF6.2: Clientes únicos con préstamos ATRASADOS que INICIARON en un rango de fechas
@Query("SELECT DISTINCT l.client FROM LoanEntity l WHERE l.status = :status AND l.startDate BETWEEN :from AND :to")
       List<ClientEntity> findDistinctClientsByStatusAndStartDateBetween(@Param("status") LoanStatus status, @Param("from") LocalDate from, @Param("to") LocalDate to);

}