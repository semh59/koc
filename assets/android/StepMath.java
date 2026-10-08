package com.neowell.app;

import java.util.Map;

/** Adım sayacı mantığı (Android'e bağımlı değil, test edilebilir). Sensör, telefon açıldığından beri toplam adımı verir. */
final class StepMath {
    static final class State {
        String day = "";
        float base = 0, carry = 0, last = -1;
        /** Son okuma günün son dakikalarında (SAMPLE_MINUTES sonrası) yapıldı: gün toplamı bilinir. */
        boolean sampled = false;
        /** Son okumadan bu yana telefon yeniden başladı (sayaç sıfırlandı), sayaç son değeri aşmış olsa da. */
        boolean rebooted = false;
        /** Telefonun açılış sayısı bilinir (önceki okumada da kaydedilmişti): yeniden başlama bundan kesin anlaşılır, sayacın düşmesi tek başına yeniden başlama sayılmaz. */
        boolean bootKnown = false;
    }

    /** 23:58 örnekleme alarmı. Gece alarmı Doze'da gecikse de bu okumaya kadarki adımlar biten güne, sonrası yeni güne yazılır. */
    static final int SAMPLE_MINUTES = 23 * 60 + 58;

    /** Bir günde bu kadar adım gerçekçi değil: üstü bozuk sayaç durumudur. */
    static final long MAX_DAY = 60000;

    static long total(State s, float counter) {
        return Math.max(0L, Math.round((double) (s.carry + counter - s.base)));
    }

    /** Açılış sayısı değişmediyse sayaç düşemez: düşük değer bayat/sırasız bir okumadır, adım yok sayılır. Yoksa sonraki doğru okuma tüm açılışdan beri adımı bugüne eklerdi. */
    private static float stable(State s, float counter) {
        return s.bootKnown && !s.rebooted && s.last >= 0 && counter < s.last ? s.last : counter;
    }

    /** Telefon yeniden başladıysa sayaç sıfırlanır: o ana kadarki adımlar carry'ye alınır. Sayaç son değerin altına indiyse ya da yeniden başlama ayrıca bilindiyse (rebooted). */
    private static void handleReboot(State s, float counter) {
        if (s.last >= 0 && (s.rebooted || (!s.bootKnown && counter < s.last))) {
            s.carry += Math.max(0, s.last - s.base);
            s.base = 0;
        }
        s.rebooted = false;
    }

    /** Geç alarmda gece yarısından sonraki adımlar eski güne yazılır; kapatmazsak son okumadan sonraki akşam adımları hiçbir güne yazılmaz.
     *  Gece 06:00'ya kadar adım azdır, daha geç alarmda sabah adımları baskın olduğu için kapatma yapılmaz. */
    static final int MAX_LATE_MINUTES = 360;

    /** Gece alarmı: biten günü şimdiki okumayla kapatır ve kapattıysa true döner. */
    static boolean closeDay(State s, String today, float counter, int minutesSinceMidnight, Map<String, Long> history) {
        counter = stable(s, counter);
        if (s.day.isEmpty() || s.day.equals(today)) return false;
        if (s.sampled) {
            update(s, today, counter, minutesSinceMidnight, history);
            return true;
        }
        if (minutesSinceMidnight > MAX_LATE_MINUTES) return false;
        handleReboot(s, counter);
        history.put(s.day, total(s, counter));
        s.day = "";
        return true;
    }

    /** Yeni okumayı işler ve bugünkü adım sayısını döndürür. Gün değiştiyse ve gece alarmı kaçtıysa, son okumaya kadarki adımlar eski güne yazılır; son okuma 23:58 örneğiyse sonrası yeni güne sayılır.
     *  Örnek yoksa ve okuma gece 06:00'ya kadarsa, son okumadan bu yana gelen adımlar da eski güne yazılır (closeDay ile aynı kural); daha geç okumada o aralığın günü bilinemez, tahmin edilmez ve yeni gün sayaçtan başlar. */
    static long update(State s, String today, float counter, int minutesSinceMidnight, Map<String, Long> history) {
        counter = stable(s, counter);
        if (!s.day.equals(today)) {
            if (!s.day.isEmpty()) {
                if (!s.sampled && minutesSinceMidnight <= MAX_LATE_MINUTES) {
                    handleReboot(s, counter);
                    history.put(s.day, total(s, counter));
                } else {
                    history.put(s.day, total(s, s.last));
                }
            }
            s.day = today;
            s.carry = 0;
            if (s.sampled) {
                s.base = s.last;
                handleReboot(s, counter);
            } else {
                s.base = counter;
            }
        } else {
            handleReboot(s, counter);
        }
        s.rebooted = false;
        s.last = counter;
        s.sampled = minutesSinceMidnight >= SAMPLE_MINUTES;
        return total(s, counter);
    }
}
