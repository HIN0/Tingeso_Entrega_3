package app.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.entities.TariffEntity;
import app.repositories.TariffRepository;

@Service
public class TariffService {

    private final TariffRepository tariffRepository;

    public TariffService(TariffRepository tariffRepository) {
        this.tariffRepository = tariffRepository;
    }

    public TariffEntity getTariff() {
        return fetchFromDb();
    }

    private TariffEntity fetchFromDb() {
        return tariffRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No tariffs configured"));
    }

    @Transactional
    public TariffEntity updateTariff(TariffEntity updated) {
        TariffEntity current = fetchFromDb(); // LLAMADA INTERNA A MÉTODO PRIVADO (OK)
        current.setDailyRentFee(updated.getDailyRentFee());
        current.setDailyLateFee(updated.getDailyLateFee());
        current.setRepairFee(updated.getRepairFee());
        return tariffRepository.save(current);
    }

    // 3. MÉTODOS DE CONSULTA: Todos llaman al PRIVADO fetchFromDb()
    public double getDailyLateFee() {
        return fetchFromDb().getDailyLateFee();
    }

    public double getDailyRentFee() {
        return fetchFromDb().getDailyRentFee(); 
    }

    public double getRepairFee() {
        return fetchFromDb().getRepairFee();
    }
}