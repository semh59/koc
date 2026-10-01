package com.neowell.app;

import java.util.Map;

/** Adım sayacı mantığı (Android'e bağımlı değil, test edilebilir). Sensör, telefon açıldığından beri toplam adımı verir. */
final class StepMath {
    static final class State {
        String day = "";
        float base = 0, carry = 0, last = -1;
    }

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

    /** Gece yarısı alarmı: biten günü şimdiki okumayla kapatır. */
    static void closeDay(State s, String today, float counter, Map<String, Long> history) {
        if (s.day.isEmpty() || s.day.equals(today)) return;
        handleReboot(s, counter);
        history.put(s.day, total(s, counter));
        s.day = "";
    }

    /** Yeni okumayı işler ve bugünkü adım sayısını döndürür. Gün değiştiyse ve gece alarmı kaçtıysa, son okumaya kadarki adımlar eski güne yazılır. */
    static long update(State s, String today, float counter, Map<String, Long> history) {
        if (!s.day.equals(today)) {
            if (!s.day.isEmpty()) {
                handleReboot(s, s.last);
                history.put(s.day, Math.max(0L, Math.round((double) (s.carry + s.last - s.base))));
            }
            s.day = today;
            s.base = counter;
            s.carry = 0;
        } else {
            handleReboot(s, counter);
        }
        s.last = counter;
        return total(s, counter);
    }
}
