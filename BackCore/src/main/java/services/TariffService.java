package services;

import entities.TariffEntity;
import repositories.TariffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TariffService {

    private final TariffRepository tariffRepository;

    public TariffService(TariffRepository tariffRepository) {
        this.tariffRepository = tariffRepository;
    }

    @Transactional(readOnly = true)
    public TariffEntity getTariff() {
        return tariffRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No tariffs configured"));
    }

    @Transactional
    public TariffEntity updateTariff(TariffEntity updated) {
        TariffEntity current = getTariff();
        current.setDailyRentFee(updated.getDailyRentFee());
        current.setDailyLateFee(updated.getDailyLateFee());
        current.setRepairFee(updated.getRepairFee());
        return tariffRepository.save(current);
    }

    public double getDailyLateFee() {
        return getTariff().getDailyLateFee();
    }

    public double getDailyRentFee() {
        return getTariff().getDailyRentFee();
    }

    public double getRepairFee() {
        return getTariff().getRepairFee();
    }
}
