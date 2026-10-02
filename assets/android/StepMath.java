package com.neowell.app;

import java.util.Map;

/** Adım sayacı mantığı (Android'e bağımlı değil, test edilebilir). Sensör, telefon açıldığından beri toplam adımı verir. */
final class StepMath {
    static final class State {
        String day = "";
        float base = 0, carry = 0, last = -1;
        /** Son okuma günün son dakikalarında (SAMPLE_MINUTES sonrası) yapıldı: gün toplamı bilinir. */
        boolean sampled = false;
    }

    /** 23:58 örnekleme alarmı. Gece alarmı Doze'da gecikse de bu okumaya kadarki adımlar biten güne, sonrası yeni güne yazılır. */
    static final int SAMPLE_MINUTES = 23 * 60 + 58;

    private static long total(State s, float counter) {
        return Math.max(0L, Math.round((double) (s.carry + counter - s.base)));
    }

    /** Telefon yeniden başladıysa sayaç sıfırlanır: o ana kadarki adımlar carry'ye alınır. */
    private static void handleReboot(State s, float counter) {
        if (s.last >= 0 && counter < s.last) {
            s.carry += Math.max(0, s.last - s.base);
            s.base = 0;
        }
    }

    /** Geç alarmda gece yarısından sonraki adımlar eski güne yazılır; kapatmazsak son okumadan sonraki akşam adımları hiçbir güne yazılmaz.
     *  Gece 06:00'ya kadar adım azdır, daha geç alarmda sabah adımları baskın olduğu için kapatma yapılmaz. */
    static final int MAX_LATE_MINUTES = 360;

    /** Gece alarmı: biten günü şimdiki okumayla kapatır ve kapattıysa true döner. */
    static boolean closeDay(State s, String today, float counter, int minutesSinceMidnight, Map<String, Long> history) {
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

    /** Yeni okumayı işler ve bugünkü adım sayısını döndürür. Gün değiştiyse ve gece alarmı kaçtıysa, son okumaya kadarki adımlar eski güne yazılır; son okuma 23:58 örneğiyse sonrası yeni güne sayılır. */
    static long update(State s, String today, float counter, int minutesSinceMidnight, Map<String, Long> history) {
        if (!s.day.equals(today)) {
            if (!s.day.isEmpty()) {
                handleReboot(s, s.last);
                history.put(s.day, Math.max(0L, Math.round((double) (s.carry + s.last - s.base))));
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
        s.last = counter;
        s.sampled = minutesSinceMidnight >= SAMPLE_MINUTES;
        return total(s, counter);
    }
}
